import { HiAnime as HiAnimeTypes } from "aniwatch";
import axios from "axios";

import { aniwatchPort, baseURL } from "../../server.js";
import HiAnimeParser from "./hiAnimeParser.js";

export class HiAnime {
  private static get _url() {
    return `${baseURL}:${aniwatchPort}/api/v2/hianime`;
  }

  public static async getIdFromTitle(title: string) {
    const res = await axios.get(`${this._url}/search?q=${title}`);
    const data = res.data.data as HiAnimeTypes.ScrapedAnimeSearchResult;
    return data.animes[0].id;
  }

  public static async getAnime(id: string) {
    const res = await axios.get(`${this._url}/anime/${id}`);
    const parsedRes = HiAnimeParser.anime(res.data.data as any);
    return parsedRes;
  }

  public static async getEpisodes(id: string) {
    const res = await axios.get(`${this._url}/anime/${id}/episodes`);
    const parsedRes = HiAnimeParser.episodes(res.data.data as any);
    return parsedRes;
  }

  public static async getSource(id: string) {
    const res = await axios.get(`${this._url}/episode/sources?animeEpisodeId=${id}`);
    const parsedRes = HiAnimeParser.source(res.data.data as any);
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
