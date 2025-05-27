import { PrismaClient, Source } from "../../dist/lib/prisma/client.js";
import { Kora } from "../types/api.js";
import { AnimePahe } from "./AnimePahe.js";

export class Prisma {
  static _client: PrismaClient | null = null;
  static get client() {
    if (!this._client) {
      this._client = new PrismaClient();
    }
    return this._client;
  }
  static _ids = new Set<string>();

  public static async initialize() {
    await this._updateLocalIds();
  }

  static async cache<T>(route: string, source: Source, fetchFn: (route: string) => Promise<T>, options = this.defaultCacheOptions): Promise<T | null> {
    if (options.useCache) {
      const cached = await Prisma.client.cachedResponse.findUnique({ where: { route, source } });
      if (cached) {
        return (cached.data as any).json as T;
      }
    }
    let data = null;
    try {
      data = (await fetchFn(route)) as any;
    } catch (e) {}
    await Prisma.client.cachedResponse.upsert({
      where: {
        route,
        source,
      },
      update: {
        data: { json: data },
        lastUpdated: new Date(),
      },
      create: {
        route,
        source,
        data: { json: data },
        animeID: options.animeID,
      },
    });
    return data as T;
  }

  public static async updateAnimeID(anime: AnimePahe.AnimeID) {
    await Prisma.client.animeID.upsert({
      where: {
        id: anime.id,
      },
      update: {
        title: anime.title,
        session: anime.session,
        lastUpdated: new Date(),
      },
      create: {
        id: anime.id,
        title: anime.title,
        session: anime.session,
      },
    });
    this._updateLocalIds();
  }

  public static async clearRelatedCache(id: string) {
    await Prisma.client.cachedResponse.deleteMany({
      where: {
        animeID: id,
      },
    });
    this._updateLocalIds();
  }

  public static findValidIds(ids: string[]) {
    return ids.filter((id) => this._ids.has(id));
  }

  public static async getAllAnimeIDs() {
    return this._ids;
  }

  private static async _updateLocalIds() {
    const ids = await Prisma.client.animeID.findMany();
    const sorted = ids.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()) as AnimePahe.AnimeID[];
    this._ids = new Set(sorted.map((e) => e.id));
    return sorted;
  }

  public static async setHistory(uid: string, animeId: string, epnum: number, timestamp: number) {
    await Prisma.client.history.upsert({
      where: {
        uid_epnum_animeId: {
          uid,
          animeId,
          epnum: epnum.toString(),
        },
      },
      update: {
        lastUpdated: new Date(),
        lastTimeStamp: timestamp,
      },
      create: {
        uid,
        animeId,
        epnum: epnum.toString(),
        lastTimeStamp: timestamp,
      },
    });
  }

  public static async getEpisodeHistory(uid: string, animeId: string, epnum: number) {
    const dbhis = await Prisma.client.history.findUnique({
      where: {
        uid_epnum_animeId: {
          uid,
          animeId,
          epnum: epnum.toString(),
        },
      },
    });

    if (!dbhis) return null;

    const history: Kora.History = {
      ...dbhis,
      epnum: parseInt(dbhis.epnum),
      lastUpdated: dbhis.lastUpdated.toISOString(),
      firstUpdated: dbhis.firstUpdated?.toISOString(),
    };

    return history;
  }

  public static async addHistory(uid: string, animeId: string, episodes: Kora.Episode[]) {
    const history = await Prisma.client.history.findMany({
      where: {
        uid,
        animeId,
      },
    });

    const episodesWithHistory = history
      .map((e) => {
        const ep = episodes.find((ep) => ep.number === parseInt(e.epnum));
        if (ep) {
          ep.history = {
            ...e,
            epnum: parseInt(e.epnum),
            lastUpdated: e.lastUpdated.toISOString(),
            firstUpdated: e.firstUpdated?.toISOString(),
          };
        }
        return ep;
      })
      .filter((ep) => ep !== undefined);

    return episodesWithHistory;
  }

  public static async getRecentHistory(uid: string, limit?: number) {
    const userHistory = await Prisma.client.history.findMany({
      where: {
        uid,
      },
      orderBy: {
        lastUpdated: "desc",
      },
      distinct: ["animeId"],
      ...(limit !== undefined ? { take: limit } : {}),
    });

    const history: Kora.History[] = userHistory.map((e: any) => ({
      ...e,
      epnum: parseInt(e.epnum),
      lastUpdated: e.lastUpdated.toISOString(),
      firstUpdated: e.firstUpdated?.toISOString(),
    }));

    return history;
  }
}

export namespace Prisma {
  export interface CacheOptions {
    useCache: boolean;
    animeID: string | null;
  }

  export const defaultCacheOptions: Prisma.CacheOptions = {
    useCache: true,
    animeID: null,
  };
}
