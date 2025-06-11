import { baseURL, port } from "../server.js";
import { HiAnime } from "../services/hianime/hianime.js";
import { Jikan } from "../services/jikan.js";
import { Kora } from "../types/api.js";
import { doesMatch, ensureNoDuplicates, proxyUrl, timeStringToMinutes } from "../utils/utils.js";
import AnimePahe from "./AnimePahe.js";
import { Prisma } from "./Prisma.js";

export default class Composer {
  public static async getAnime(id: string | AnimePahe.AnimeID, uid?: string, useCache: boolean = true) {
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

      return this._getAnime(id, uid, options);
    } catch {
      return null;
    }
  }

  private static async _getAnime(id: AnimePahe.AnimeID, uid?: string, options = Prisma.defaultCacheOptions) {
    const startTime = performance.now();
    try {
      const [pahe, jikan, hiAnimeId] = await Promise.all([AnimePahe.getAnime(id, options), Jikan.getAnimeFromTitle(id.title, options), HiAnime.getIdFromTitle(id.title, options)]);
      const [hiAnime, hiAnimeEpisodes] = hiAnimeId ? await Promise.all([HiAnime.getAnime(hiAnimeId, options), HiAnime.getEpisodes(hiAnimeId, options)]) : [null, null];

      if (!pahe || !pahe.title) return null;

      const episodes = pahe.episodes
        .map((e, i) => {
          const hiAnimeEpisode = hiAnimeEpisodes && hiAnimeEpisodes.find ? hiAnimeEpisodes?.find((e2) => e2.number === e.number) : null;
          if (!e.session) {
            return null;
          }
          const ep: Kora.Episode = {
            numberInShow: e.number,
            number: i + 1,
            session: e.session,
            hiAnimeEpisodeId: hiAnimeEpisode?.id ?? null,
            title: hiAnimeEpisode?.title ?? `Episode ${e.number}`,
            thumbnail: proxyUrl(e.thumbnail),
            duration: e.duration,
            isFiller: hiAnimeEpisode?.isFiller ?? null,
          };
          return ep;
        })
        .filter((ep) => ep !== null)
        .sort((a, b) => a.number - b.number);

      const poster = pahe.poster ?? jikan?.images.jpg.large_image_url ?? hiAnime?.poster ?? null;

      const anime: Kora.Anime | null = {
        id: id.id,
        session: id.session,
        anilistId: hiAnime?.anilistId ?? null,
        hiAnimeId,
        malId: jikan?.mal_id ?? hiAnime?.malId ?? null,
        title: pahe.title,
        description: pahe.synopsis ?? jikan?.synopsis ?? hiAnime?.description ?? null,
        poster: proxyUrl(poster),
        trailer: {
          ytid: jikan?.trailer.youtube_id ?? null,
          thumbnail: jikan?.trailer.images?.maximum_image_url ?? null,
          url: jikan?.trailer.url ?? null,
        },
        episodes: episodes,
        info: {
          titles: {
            english: jikan?.title_english ?? pahe.title,
            romanji: doesMatch(pahe.title, jikan?.title ?? null) ? null : jikan?.title ?? null,
            japanese: jikan?.title_japanese ?? null,
          },
          mediaType: jikan?.type ?? pahe.info.type ?? hiAnime?.type ?? null,
          source: jikan?.source ?? null,
          episodes: pahe.episodes.length,
          studios: jikan?.studios?.map((s) => s.name) ?? [],
          producers: jikan?.producers?.map((p) => p.name) ?? [],
          licensors: jikan?.licensors?.map((l) => l.name) ?? [],
          status: pahe.info.status,
          airing: jikan?.airing ?? null,
          aired: {
            from: pahe.info.aired.start ?? (jikan?.aired?.from ? new Date(jikan.aired.from).toISOString() : null),
            to: pahe.info.aired.end ?? (jikan?.aired?.to ? new Date(jikan.aired.to).toISOString() : null),
          },
          duration: timeStringToMinutes(jikan?.duration ?? null),
          stats: {
            score: jikan?.score ?? null,
            scoredBy: jikan?.scored_by ?? null,
            rank: jikan?.rank ?? null,
            popularity: jikan?.popularity ?? null,
            members: jikan?.members ?? null,
            favorites: jikan?.favorites ?? null,
          },
          season: jikan?.season ?? null,
          year: jikan?.year ?? null,
          broadcast: {
            day: jikan?.broadcast?.day ?? null,
            time: jikan?.broadcast?.time ?? null,
            timezone: jikan?.broadcast?.timezone ?? null,
          },
          genres: ensureNoDuplicates([...(pahe.info.genres || []), ...(pahe.info.themes || []), ...(jikan?.themes?.map((t) => t.name) || [])]).map((g) => g.toLowerCase()),
        },
      };

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`\x1b[32m[✓]\x1b[0m GET in ${duration.toFixed(2)}s ${id.title}`);
      return anime;
    } catch (error) {
      console.log(`\x1b[31m[X] GET ${id.title}\x1b[0m `);
      throw error;
    }
  }

  public static async getSource(uid: string | null, id: string | Kora.Anime, epnum: number) {
    const startTime = performance.now();
    const anime = typeof id == "string" ? await Composer.getAnime(id, undefined) : id;
    try {
      const ep = anime?.episodes[epnum - 1];

      if (!anime || !ep) return null;

      const [pahe, hiAnime] = await Promise.all([AnimePahe.getSource(anime!.id, anime?.session, epnum, ep?.session), HiAnime.getSource(ep.hiAnimeEpisodeId)]);

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
      console.log(`\x1b[32m[✓]\x1b[0m GET in ${duration.toFixed(2)}s ${anime.title} EP: ${epnum}`);
      return source;
    } catch {
      console.log(`\x1b[31m[X] GET ${anime?.title + "EP: ${epnum}"}\x1b[0m `);
      return null;
    }
  }

  private static async _getAllAnime() {
    const all = await Prisma.getAllAnimeIDs();
    const animes = new Set<Kora.Anime>();
    for (const id of all.keys()) {
      const anime = await Composer.getAnime(id);
      anime && animes.add(anime);
    }
    const arr = Array.from(animes);
    return arr;
  }

  public static async getAllAnime(options = Prisma.defaultCacheOptions) {
    return await Prisma.cache("allAnime", "COMPOSER", this._getAllAnime, options);
  }
}
