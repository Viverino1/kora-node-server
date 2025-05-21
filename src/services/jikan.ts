import axios from "axios";
import PQueue from "p-queue";
import { Source } from "../../dist/lib/prisma/index.js";
import { Prisma } from "../core/Prisma.js";
import { jikanBaseURL } from "../server.js";
import { doesMatch } from "../utils/utils.js";

export class Jikan {
  public static queue = new PQueue({ interval: 1000, intervalCap: 1 });

  public static get url() {
    return jikanBaseURL;
  }

  private static async _getAnime(route: string) {
    const res = await Jikan.queue.add(() => axios.get(Jikan.url + route));
    if (!res || !res.data?.data) return null;
    return res.data.data as Jikan.Anime;
  }

  public static async getAnime(id: number, options = Prisma.defaultCacheOptions) {
    const route = `/anime/${id}/full`;
    const data = await Prisma.cache(route, Source.JIKAN, this._getAnime, options);
    return data;
  }

  private static async _getIdFromTitle(route: string, title: string) {
    const res = await Jikan.queue.add(() => axios.get(Jikan.url + route));
    if (!res || !res.data?.data || !Array.isArray(res.data.data) || res.data.data.length === 0) {
      return null;
    }
    const animes = res.data.data as Jikan.Anime[];
    const match = animes.find((anime) => doesMatch(title, [anime.title, ...anime.title_synonyms, ...anime.titles.map((t) => t.title), anime.title_english, anime.title_japanese]));
    return match ?? null;
  }

  public static async getAnimeFromTitle(title: string, options = Prisma.defaultCacheOptions) {
    const route = `/anime?q=${encodeURIComponent(title)}`;
    const data = await Prisma.cache(route, Source.JIKAN, () => this._getIdFromTitle(route, title), options);
    return data;
  }

  public static async _getEpisodes(route: string, page: number = 1): Promise<Jikan.Episode[] | null> {
    const res = await Jikan.queue.add(() => axios.get(`${Jikan.url}${route}?page=${page}`));
    if (!res || !res.data?.data) return null;
    const data = res.data as Jikan.EpisodeList;
    if (data.pagination.has_next_page) {
      const nextPage = await this._getEpisodes(route, page + 1);
      if (nextPage) {
        return [...data.data, ...nextPage];
      }
    }
    return data.data;
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

  export interface EpisodeList {
    pagination: {
      last_visible_page: number;
      has_next_page: boolean;
    };
    data: Episode[];
  }

  export interface Episode {
    mal_id: number;
    url: string;
    title: string;
    title_japanese: string;
    title_romanji: string | null;
    aired: string;
    score: number;
    filler: boolean;
    recap: boolean;
    forum_url: string;
  }
}
