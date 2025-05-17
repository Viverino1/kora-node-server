import { PrismaClient, Source } from "../lib/prisma/client.js";
import { AnimePahe } from "./AnimePahe.js";

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
