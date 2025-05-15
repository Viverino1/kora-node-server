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

  static async cache<T>(route: string, source: Source, fetchFn: (route: string) => Promise<T>, options: { useCache: boolean } = { useCache: true }) {
    if (options.useCache) {
      const cached = await Prisma.client.cachedResponse.findUnique({ where: { route, source } });
      if (cached) {
        return cached.data as any as T;
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
        data,
        lastUpdated: new Date(),
      },
      create: {
        route,
        source,
        data,
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
}
