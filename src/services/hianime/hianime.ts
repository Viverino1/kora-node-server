import { HiAnime as HiAnimeTypes } from "aniwatch";
import axios from "axios";

import { aniwatchPort, baseURL } from "../../server.js";
import HiAnimeParser from "./hiAnimeParser.js";
import { Prisma } from "../../core/Prisma.js";
import { CacheType } from "../../prisma/index.js";

export class HiAnime {
  private static get _url() {
    return `${baseURL}:${aniwatchPort}/api/v2/hianime`;
  }

  public static async getIdFromTitle(title: string, ignoreCache = false) {
    const res = await Prisma.cacheJSON(title, ignoreCache, CacheType.HIANIME_ID, async () => (await axios.get(`${this._url}/search?q=${title}`)).data);
    const data = res.data as HiAnimeTypes.ScrapedAnimeSearchResult;
    return data.animes[0].id;
  }

  public static async getAnime(id: string, ignoreCache = false) {
    const res = await Prisma.cacheJSON(id, ignoreCache, CacheType.HIANIME_ANIME, async () => (await axios.get(`${this._url}/anime/${id}`)).data);
    const parsedRes = HiAnimeParser.anime(res.data as any);
    return parsedRes;
  }

  public static async getEpisodes(id: string, ignoreCache = false) {
    const res = await Prisma.cacheJSON(id, ignoreCache, CacheType.HIANIME_EPISODES, async () => (await axios.get(`${this._url}/anime/${id}/episodes`)).data);
    const parsedRes = HiAnimeParser.episodes(res.data as any);
    return parsedRes;
  }

  public static async getSource(id: string, ignoreCache = false) {
    const res = await Prisma.cacheJSON(id, ignoreCache, CacheType.HIANIME_SOURCE, async () => (await axios.get(`${this._url}/episode/sources?animeEpisodeId=${id}`)).data);
    const parsedRes = HiAnimeParser.source(res.data as any);
    return parsedRes;
  }
}

export namespace HiAnime {
  type Outro = {
    start: number | undefined;
    end: number | undefined;
  };

  type Track = {
    file: string;
    label: string;
    kind: string;
    default: boolean;
  };

  export type ScrapedEpisodeSources = HiAnimeTypes.ScrapedAnimeEpisodesSources & {
    outro: Outro | undefined;
    tracks: Track[] | undefined;
  };

  export type Status = "upcoming" | "airing" | "finished" | null;

  export interface MinimalAnimeInfo {
    id: string;
    name: string | null;
    poster: string | null;
    episodeCount: number | null;
    type: string | null;
  }

  export interface Anime {
    id: string;
    anilistId: number | null;
    malId: number | null;
    name: string | null;
    poster: string | null;
    description: string | null;
    rating: string | null;
    quality: string | null;
    episodeCount: number;
    type: string | null;
    duration: number | null;
    startDate: string | null;
    endDate: string | null;
    season: string | null;
    status: Status;
    malscore: number | null;
    genres: string[];
    studios: string[];
    producers: string[];
    recommendedAnime: MinimalAnimeInfo[];
    related: MinimalAnimeInfo[];
  }

  export interface Episode {
    id: string;
    title: string | null;
    number: number;
    isFiller: boolean;
  }

  export interface Source {
    url: string;
    referer: string | null;
    introStart: number | null;
    introEnd: number | null;
    outroStart: number | null;
    outroEnd: number | null;
    subs: string | null;
  }
}
