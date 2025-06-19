import { baseURL, port } from "../server.js";
import { HiAnime } from "../services/hianime/hianime.js";
import { Jikan } from "../services/jikan.js";
import { Kora } from "../types/api.js";
import { doesMatch, encodeStringToId, ensureNoDuplicates, imageUrlToBase64, proxyUrl, timeStringToMinutes } from "../utils/utils.js";
import AnimePahe from "./AnimePahe.js";
import { Prisma } from "./Prisma.js";

export default class Composer {
  public static async getAnime(id: string | AnimePahe.AnimeID, useCache: boolean = true) {
    try {
      if (typeof id === "string") {
        id = (await Prisma.client.animeID.findUnique({
          where: {
            id,
          },
        })) as AnimePahe.AnimeID;
      }

      const options: Prisma.CacheOptions = Prisma.defaultCacheOptions;
      options.useCache = useCache;
      options.animeID = id.id;

      return this._getAnime(id, options);
    } catch {
      return null;
    }
  }

  private static async _getAnime(id: AnimePahe.AnimeID, options = Prisma.defaultCacheOptions): Promise<{ data: Kora.Anime; fromCache: boolean } | null> {
    const startTime = performance.now();
    try {
      const [pahe, jikan, hiAnimeId] = await Promise.all([AnimePahe.getAnime(id, options), Jikan.getAnimeFromTitle(id.title, options), HiAnime.getIdFromTitle(id.title, options)]);
      const [hiAnime, hiAnimeEpisodes] = hiAnimeId && hiAnimeId?.data ? await Promise.all([HiAnime.getAnime(hiAnimeId?.data, options), HiAnime.getEpisodes(hiAnimeId?.data, options)]) : [null, null];

      if (!pahe || !pahe.data || !pahe.data.title) return null;

      const epOffset = (pahe.data.episodes[0] && pahe.data.episodes[0].number && !isNaN(parseInt(pahe.data.episodes[0].number)) ? parseInt(pahe.data.episodes[0].number) : 1) - 1;

      const episodes: (Kora.Episode | null)[] = pahe.data.episodes
        .map((e, i) => {
          if (!e || !e.session) {
            return null;
          }
          const episodeNumber = parseInt(e?.number) - epOffset;
          const hiAnimeEpisode = hiAnimeEpisodes?.data?.find((e2) => e2.number === episodeNumber);
          const ep: Kora.Episode = {
            id: encodeStringToId(e.number),
            index: i,
            epStr: e.number,
            num: episodeNumber,
            session: e.session,
            hiAnimeEpisodeId: hiAnimeEpisode?.id ?? null,
            title: hiAnimeEpisode?.title ?? `Episode ${e.number}`,
            thumbnail: proxyUrl(e.thumbnail),
            duration: e.duration,
            isFiller: hiAnimeEpisode?.isFiller ?? null,
          };
          return ep;
        })
        .filter((ep) => ep !== null);

      for (const episode of episodes) {
        if (episode && episode.thumbnail) {
          const key = [id.id, episode.id].join(":");
          episode.thumbnail = await imageUrlToBase64(key, episode.thumbnail);
        }
      }

      let poster = proxyUrl(pahe.data.poster ?? jikan?.data?.images.jpg.large_image_url ?? hiAnime?.data?.poster ?? null);
      poster = poster ? await imageUrlToBase64(id.id, poster) : null;

      const anime: Kora.Anime = {
        id: id.id,
        session: id.session,
        anilistId: hiAnime?.data?.anilistId ?? null,
        hiAnimeId: hiAnimeId?.data ?? null,
        malId: jikan?.data?.mal_id ?? hiAnime?.data?.malId ?? null,
        title: pahe.data.title,
        description: pahe.data.synopsis ?? jikan?.data?.synopsis ?? hiAnime?.data?.description ?? null,
        poster: poster,
        trailer: {
          ytid: jikan?.data?.trailer.youtube_id ?? null,
          thumbnail: jikan?.data?.trailer.images?.maximum_image_url ?? null,
          url: jikan?.data?.trailer.url ?? null,
        },
        episodes: episodes.filter((e) => e !== null),
        info: {
          titles: {
            english: jikan?.data?.title_english ?? pahe.data.title,
            romanji: doesMatch(pahe.data.title, jikan?.data?.title ?? null) ? null : jikan?.data?.title ?? null,
            japanese: jikan?.data?.title_japanese ?? null,
          },
          mediaType: jikan?.data?.type ?? pahe.data.info.type ?? hiAnime?.data?.type ?? null,
          source: jikan?.data?.source ?? null,
          episodes: episodes[episodes.length - 1]?.num ?? pahe.data.info.episodeCount,
          studios: jikan?.data?.studios?.map((s) => s.name) ?? [],
          producers: jikan?.data?.producers?.map((p) => p.name) ?? [],
          licensors: jikan?.data?.licensors?.map((l) => l.name) ?? [],
          status: pahe.data.info.status,
          airing: jikan?.data?.airing ?? null,
          aired: {
            from: pahe.data.info.aired.start ?? (jikan?.data?.aired?.from ? new Date(jikan.data?.aired.from).toISOString() : null),
            to: pahe.data.info.aired.end ?? (jikan?.data?.aired?.to ? new Date(jikan.data?.aired.to).toISOString() : null),
          },
          duration: timeStringToMinutes(jikan?.data?.duration ?? null),
          stats: {
            score: jikan?.data?.score ?? null,
            scoredBy: jikan?.data?.scored_by ?? null,
            rank: jikan?.data?.rank ?? null,
            popularity: jikan?.data?.popularity ?? null,
            members: jikan?.data?.members ?? null,
            favorites: jikan?.data?.favorites ?? null,
          },
          season: jikan?.data?.season ?? null,
          year: jikan?.data?.year ?? null,
          broadcast: {
            day: jikan?.data?.broadcast?.day ?? null,
            time: jikan?.data?.broadcast?.time ?? null,
            timezone: jikan?.data?.broadcast?.timezone ?? null,
          },
          genres: ensureNoDuplicates([...(pahe.data.info.genres || []), ...(pahe.data.info.themes || []), ...(jikan?.data?.themes?.map((t) => t.name) || [])]).map((g) => g.toLowerCase()),
        },
      };

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`\x1b[32m[✓]\x1b[0m GET in ${duration.toFixed(2)}s ${id.title}`);
      return {
        data: anime,
        fromCache: pahe.fromCache,
      };
    } catch (error) {
      console.log(`\x1b[31m[X] GET ${id.title}\x1b[0m `);
      throw error;
    }
  }

  public static async getSource(id: string | Kora.Anime, epid: string, useCache: boolean = true) {
    const options: Prisma.CacheOptions = Prisma.defaultCacheOptions;
    options.useCache = useCache;
    options.animeID = typeof id === "string" ? id : id.id;

    return this._getSource(id, epid, options);
  }

  private static async _getSource(id: string | Kora.Anime, epid: string, options = Prisma.defaultCacheOptions) {
    const startTime = performance.now();
    const anime = typeof id == "string" ? (await Composer.getAnime(id))?.data ?? null : id;
    try {
      const ep = anime?.episodes.find((e) => e.id == epid);

      if (!anime || !ep) return null;
      const [pahe, hiAnime] = await Promise.all([AnimePahe.getSource(anime.id, anime.session, epid, ep.session, options), HiAnime.getSource(ep.hiAnimeEpisodeId, options)]);

      if (!pahe) return null;
      const source: Kora.Source = {
        ...ep,
        ...pahe,
        proxiedStreamUrl: `${baseURL}:${port}/proxy?url=${encodeURIComponent(pahe.streamUrl)}`,
        intro: {
          start: hiAnime?.introStart ?? null,
          end: hiAnime?.introEnd ?? null,
        },
        outro: {
          start: hiAnime?.outroStart ?? null,
          end: hiAnime?.outroEnd ?? null,
        },
        backup:
          hiAnime?.url && hiAnime?.referer && hiAnime?.subs
            ? {
                url: hiAnime?.url,
                referer: hiAnime?.referer,
                subs: hiAnime?.subs,
              }
            : null,
      };

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`\x1b[32m[✓]\x1b[0m GET in ${duration.toFixed(2)}s ${anime.title} EP: ${ep.epStr}`);
      return source;
    } catch {
      console.log(`\x1b[31m[X] GET ${anime?.title + `EP: ${epid}`}\x1b[0m `);
      return null;
    }
  }

  public static async updateAnime(id: string | AnimePahe.AnimeID) {
    const cache = await this.getAnime(id);
    const fresh = cache?.fromCache ? await this.getAnime(id, false) : cache;
    if (!fresh || !fresh.data) {
      return null;
    }

    const cachedEpisodes = cache?.fromCache ? cache.data.episodes : [];
    const freshEpisodes = fresh.data.episodes;

    const episodesToUpdate = freshEpisodes.filter((ep) => !cachedEpisodes.some((ce) => ce.id === ep.id));

    if (episodesToUpdate.length === 0) {
      console.log(`No new episodes to update for ${fresh.data.title}`);
      return null;
    }

    for (const episode of episodesToUpdate) {
      console.log(`Updating episode: ${episode.epStr}`);
      await this.getSource(fresh.data, episode.id);
    }
  }
}
