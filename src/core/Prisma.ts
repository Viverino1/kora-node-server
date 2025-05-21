import { PrismaClient, Source } from "../../dist/lib/prisma/client.js";
import { Kora } from "../types/api.js";
import { AnimePahe } from "./AnimePahe.js";
import Composer from "./Composer.js";

export class Prisma {
  static _client: PrismaClient | null = null;
  static get client() {
    if (!this._client) {
      this._client = new PrismaClient();
    }
    return this._client;
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
  }

  public static async clearRelatedCache(id: string) {
    await Prisma.client.cachedResponse.deleteMany({
      where: {
        animeID: id,
      },
    });
  }

  public static async getAnimeID(id: string) {
    return (await Prisma.client.animeID.findUnique({
      where: {
        id,
      },
    })) as AnimePahe.AnimeID | null;
  }

  public static async getAllAnimeIDs() {
    return (await Prisma.client.animeID.findMany()) as AnimePahe.AnimeID[];
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

  public static async getHistory(uid: string, animeId: string, epnum: number) {
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

  public static async getRecentlyWatchedAnime(uid: string, limit?: number) {
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

    const anime = (await Promise.all(history.map(async (h) => await Composer.getAnime(h.animeId, uid, h)))).filter((a) => a !== null);

    return anime;
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
