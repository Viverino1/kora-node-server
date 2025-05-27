import { HiAnime as HiAnimeTypes } from "aniwatch";
import axios from "axios";

import PQueue from "p-queue";
import { Source } from "../../../dist/lib/prisma/index.js";
import { Prisma } from "../../core/Prisma.js";
import { aniwatchPort, baseURL } from "../../server.js";
import { doesMatch } from "../../utils/utils.js";
import HiAnimeParser from "./hiAnimeParser.js";

export class HiAnime {
  public static queue = new PQueue({ interval: 1000, intervalCap: 1 });

  public static get url() {
    return `${baseURL}:${aniwatchPort}/api/v2/hianime`;
  }

  private static async _getIdFromTitle(route: string, title: string) {
    const res = await HiAnime.queue.add(() => axios.get(HiAnime.url + route));
    if (!res || !res.data?.data || !res.data.data?.animes || !Array.isArray(res.data.data.animes) || res.data.data.animes.length === 0) {
      return null;
    }
    const data = res.data.data as HiAnimeTypes.ScrapedAnimeSearchResult;
    const animes = data.animes;
    const match = animes.find((anime) => doesMatch(title, [anime.name, anime.jname]));
    return match?.id ?? null;
  }

  public static async getIdFromTitle(title: string, options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    try {
      const route = `/search?q=${encodeURIComponent(title)}`;
      const data = await Prisma.cache(route, Source.HIANIME, () => this._getIdFromTitle(route, title), options);
      return data;
    } catch (e) {
      return null;
    }
  }

  private static async _getAnime(route: string) {
    const res = await HiAnime.queue.add(() => axios.get(HiAnime.url + route));
    if (!res || !res.data || !res.data.data) return null;
    const parsedRes = HiAnimeParser.anime(res.data.data as any);
    return parsedRes;
  }

  public static async getAnime(id: string, options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    const route = `/anime/${id}`;
    const data = await Prisma.cache(route, Source.HIANIME, this._getAnime, options);
    return data;
  }

  private static async _getEpisodes(route: string) {
    const res = await HiAnime.queue.add(() => axios.get(HiAnime.url + route));
    if (!res || !res.data || !res.data.data) return null;
    const parsedRes = HiAnimeParser.episodes(res.data.data);
    return parsedRes;
  }
  public static async getEpisodes(id: string, options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    const route = `/anime/${id}/episodes`;
    const data = await Prisma.cache(route, Source.HIANIME, this._getEpisodes, options);
    return data;
  }

  private static async _getSource(route: string) {
    const res = await HiAnime.queue.add(() => axios.get(HiAnime.url + route));
    if (!res || !res.data || !res.data.data) return null;
    const parsedRes = HiAnimeParser.source(res.data.data);
    return parsedRes;
  }

  public static async getSource(id: string | null, options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    if (!id) return null;
    const route = `/episode/sources?animeEpisodeId=${id}`;
    const data = await Prisma.cache(route, Source.HIANIME, this._getSource, options);
    return data;
  }

  private static async _getHome() {
    const res = await HiAnime.queue.add(() => axios.get(HiAnime.url + "/home"));
    if (!res || !res.data || !res.data.data) return null;
    const parsedRes = HiAnimeParser.home(res.data.data);
    return parsedRes;
  }

  public static async getHome(options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    const route = `/home`;
    const data = await Prisma.cache(route, Source.HIANIME, this._getHome, options);
    return data;
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

  export interface Home {
    spotlightAnimes: string[];
    trendingAnimes: string[];
    latestEpisodeAnimes: string[];
    topUpcomingAnimes: string[];
    top10Animes: {
      today: string[];
      week: string[];
      month: string[];
    };
    topAiringAnimes: string[];
    mostPopularAnimes: string[];
    mostFavoriteAnimes: string[];
    latestCompletedAnimes: string[];
  }
}
