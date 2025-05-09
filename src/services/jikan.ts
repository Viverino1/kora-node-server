import axios from "axios";
import { jikanBaseURL } from "../server.js";
import { Prisma } from "../core/Prisma.js";
import { CacheType } from "../prisma/index.js";


export class Jikan {
  private static get _url() {
    return jikanBaseURL;
  }

  public static async getAnimeById(id: number, ignoreCache = false) {
    const res = await Prisma.cacheJSON(id.toString(), ignoreCache, CacheType.JIKAN_ANIME, async () => (await axios.get(`${this._url}/anime/${id}/full`)).data);
    return res.data as Jikan.Anime;
  }
}

export namespace Jikan {
  export interface Anime {
    mal_id: number;
    url: string;
    images: AnimeImages;
    trailer: AnimeTrailer;
    approved: boolean;
    titles: AnimeTitle[];
    title: string;
    title_english: string | null;
    title_japanese: string | null;
    title_synonyms: string[];
    type: string;
    source: string;
    episodes: number | null;
    status: string;
    airing: boolean;
    aired: AnimeAired;
    duration: string;
    rating: string;
    score: number | null;
    scored_by: number | null;
    rank: number | null;
    popularity: number | null;
    members: number;
    favorites: number;
    synopsis: string | null;
    background: string | null;
    season: string | null;
    year: number | null;
    broadcast: AnimeBroadcast;
    producers: AnimeProducer[];
    licensors: AnimeProducer[];
    studios: AnimeProducer[];
    genres: AnimeGenre[];
    explicit_genres: AnimeGenre[];
    themes: AnimeGenre[];
    demographics: AnimeGenre[];
    relations: AnimeRelation[];
    theme: AnimeTheme;
    external: AnimeExternal[];
    streaming: AnimeStreaming[];
  }

  export interface AnimeImages {
    jpg: AnimeImageSet;
    webp: AnimeImageSet;
  }

  export interface AnimeImageSet {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  }

  export interface AnimeTrailer {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
    images: AnimeTrailerImages;
  }

  export interface AnimeTrailerImages {
    image_url: string | null;
    small_image_url: string | null;
    medium_image_url: string | null;
    large_image_url: string | null;
    maximum_image_url: string | null;
  }

  export interface AnimeTitle {
    type: string;
    title: string;
  }

  export interface AnimeAired {
    from: string | null;
    to: string | null;
    prop: AnimeAiredProp;
    string: string;
  }

  export interface AnimeAiredProp {
    from: AnimeAiredDate;
    to: AnimeAiredDate;
  }

  export interface AnimeAiredDate {
    day: number | null;
    month: number | null;
    year: number | null;
  }

  export interface AnimeBroadcast {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  }

  export interface AnimeProducer {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }

  export interface AnimeGenre {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }

  export interface AnimeRelation {
    relation: string;
    entry: AnimeRelationEntry[];
  }

  export interface AnimeRelationEntry {
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }

  export interface AnimeTheme {
    openings: string[];
    endings: string[];
  }

  export interface AnimeExternal {
    name: string;
    url: string;
  }

  export interface AnimeStreaming {
    name: string;
    url: string;
  }

  export interface AnimeResponse {
    data: Anime;
  }
}
