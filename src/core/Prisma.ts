import { CacheType, PrismaClient } from '../prisma/client.js'

export class Prisma {
    static _client: PrismaClient | null = null;
    static get client() {
        if (!this._client) {
            this._client = new PrismaClient();
        }
        return this._client;
    }

    static async cacheJSON<T>(id: string, ignoreCache: boolean, type: CacheType, fetchFn: () => Promise<T>) {
        if (!ignoreCache) {
            const cached = await Prisma.client.cacheJSON.findUnique({ where: { id, type: type } });
            if (cached) {
                return cached.json as any as T;
            }
        }
        const data = await fetchFn();
        await Prisma.client.cacheJSON.upsert({
            where: {
                id,
                type,
            },
            update: {
                json: data as any,
                cachedAt: new Date(),
            },
            create: {
                id,
                type,
                json: data as any,
            },

        });
        return data;
    }
}