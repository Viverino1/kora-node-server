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

  static async getFromCache<T>(route: string, source: Source) {
    const cached = await Prisma.client.cachedResponse.findUnique({ where: { route, source } });

    if (cached) {
      return (cached.data as any).json as T;
    } else {
      return null;
    }
  }

  static async cache<T>(
    route: string,
    source: Source,
    fetchFn: (route: string) => Promise<T>,
    options = this.defaultCacheOptions
  ): Promise<{
    data: T;
    fromCache: boolean;
  } | null> {
    if (options.useCache) {
      const cached = await Prisma.client.cachedResponse.findUnique({ where: { route, source } });

      if (cached) {
        return {
          data: (cached.data as any).json as T,
          fromCache: true,
        };
      }
    }
    let data = null;
    try {
      data = (await fetchFn(route)) as any;
    } catch (e) {}
    if (!data && source == Source.ANIMEPAHE) return null;
    await Prisma.client.cachedResponse.upsert({
      where: {
        route,
        source,
      },
      update: {
        data: { json: data },
        lastUpdated: new Date(),
        animeID: options.animeID,
      },
      create: {
        route,
        source,
        data: { json: data },
        animeID: options.animeID,
      },
    });
    return {
      data: data as T,
      fromCache: false,
    };
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
    if (this._ids.size === 0) {
      await this._updateLocalIds();
    }
    return this._ids;
  }

  private static async _updateLocalIds() {
    const ids = await Prisma.client.animeID.findMany();
    const sorted = ids.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()) as AnimePahe.AnimeID[];
    this._ids = new Set(sorted.map((e) => e.id));
    return sorted;
  }

  public static async setHistory(uid: string, animeId: string, epnum: number, timestamp: number, duration: number) {
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
        duration: duration,
      },
      create: {
        uid,
        animeId,
        epnum: epnum.toString(),
        lastTimeStamp: timestamp,
        duration: duration,
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
    };

    return history;
  }

  public static async getHistory(uid: string, limit?: number) {
    const userHistory = await Prisma.client.history.findMany({
      where: {
        uid,
      },
      orderBy: {
        lastUpdated: "desc",
      },
      ...(limit !== undefined ? { take: limit } : {}),
    });

    const history: Kora.History[] = userHistory.map((e: any) => ({
      ...e,
      epnum: parseInt(e.epnum),
      lastUpdated: e.lastUpdated.toISOString(),
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
