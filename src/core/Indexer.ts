import PQueue from "p-queue";
import AnimePahe from "../core/AnimePahe.js";
import { HiAnime } from "../services/hianime/hianime.js";
import { Jikan } from "../services/jikan.js";
import { doesMatch, ensureNoDuplicates, timeStringToMinutes } from "../utils/utils.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  static async initialize() {
    setInterval(async () => {
      console.log(`Updating anime list...`);
      const changes = await AnimePahe.updateAllAnime();
      console.log(changes);
      changes?.createdAnimes.forEach((a) => {
        this.queue.add(() => Indexer.getAnime(a));
      });
      changes?.updatedAnimes.forEach((a) => {
        this.queue.add(() => Indexer.getAnime(a));
      });
    }, 1000 * 60 * 5);
  }
  static async seed() {
    const res = await AnimePahe.getAllAnime();
    if (!res) return null;
    const animes = res.animes;

    for (const anime of animes) {
      this.queue.add(() => Indexer.getAnime(anime));
    }
  }
  static async getAnime(id: AnimePahe.AnimeID, options: { useCache: boolean } = { useCache: true }) {
    const startTime = performance.now();
    try {
      const [pahe, jikan, hiAnimeId] = await Promise.all([AnimePahe.getAnime(id, options), Jikan.getAnimeFromTitle(id.title, options), HiAnime.getIdFromTitle(id.title, options)]);
      const [hiAnime, hiAnimeEpisodes] = hiAnimeId ? await Promise.all([HiAnime.getAnime(hiAnimeId, options), HiAnime.getEpisodes(hiAnimeId, options)]) : [null, null];

      if (!pahe || !pahe.title) return null;

      const episodes = pahe.episodes
        .map((e) => {
          const hiAnimeEpisode = hiAnimeEpisodes && hiAnimeEpisodes.find ? hiAnimeEpisodes?.find((e2) => e2.number === e.number) : null;
          return {
            number: e.number,
            session: e.session,
            title: hiAnimeEpisode?.title ?? `Episode ${e.number}`,
            thumbnail: e.thumbnail,
            duration: e.duration,
            isFiller: hiAnimeEpisode?.isFiller,
          };
        })
        .sort((a, b) => a.number - b.number);
      const anime = {
        animePaheId: id,
        hiAnimeId,
        malId: jikan?.mal_id ?? hiAnime?.malId,
        anilistId: hiAnime?.anilistId,
        title: pahe.title,
        description: pahe.synopsis ?? jikan?.synopsis ?? hiAnime?.description,
        poster: pahe.poster ?? jikan?.images.jpg.large_image_url ?? hiAnime?.poster,
        trailer: {
          ytid: jikan?.trailer.youtube_id,
          thumbnail: jikan?.trailer.images?.maximum_image_url,
          url: jikan?.trailer.url,
        },
        episodes,
        info: {
          titles: {
            english: jikan?.title_english ?? pahe.title,
            romanji: doesMatch(pahe.title, jikan?.title ?? null) ? null : jikan?.title,
            japanese: jikan?.title_japanese,
          },
          type: jikan?.type ?? pahe.info.type ?? hiAnime?.type,
          source: jikan?.source,
          episodes: pahe.episodes.length,
          studios: jikan?.studios?.map((s) => s.name) ?? [],
          producers: jikan?.producers?.map((p) => p.name) ?? [],
          licensors: jikan?.licensors?.map((l) => l.name) ?? [],
          status: pahe.info.status,
          airing: jikan?.airing,
          aired: {
            from: pahe.info.aired.start ?? (jikan?.aired?.from ? new Date(jikan.aired.from).toISOString() : null),
            to: pahe.info.aired.end ?? (jikan?.aired?.to ? new Date(jikan.aired.to).toISOString() : null),
          },
          duration: timeStringToMinutes(jikan?.duration ?? null),
          stats: {
            score: jikan?.score,
            scoredBy: jikan?.scored_by,
            rank: jikan?.rank,
            popularity: jikan?.popularity,
            members: jikan?.members,
            favorites: jikan?.favorites,
          },
          season: jikan?.season,
          year: jikan?.year,
          broadcast: {
            day: jikan?.broadcast?.day,
            time: jikan?.broadcast?.time,
            timezone: jikan?.broadcast?.timezone,
          },
          genres: ensureNoDuplicates([...(pahe.info.genres || []), ...(pahe.info.themes || []), ...(jikan?.themes?.map((t) => t.name) || [])]).map((g) => g.toLowerCase()),
        },
      };

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`\x1b[32m[✓]\x1b[0m GET in ${duration.toFixed(2)}ms ${id.title}`);
      return anime;
    } catch (error) {
      console.log(`\x1b[31m[X] GET ${id.title}\x1b[0m `);
      throw error;
    }
  }
}
