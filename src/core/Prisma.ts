import { CacheType, PrismaClient } from '../prisma/client.js'

export class Prisma {
    static _client: PrismaClient | null = null;
    static get client() {
        if (!this._client) {
            this._client = new PrismaClient();
        }
        return this._client;
    }

    static async cacheJSON<T>(id: string, type: CacheType, fetchFn: () => Promise<T>) {
        const cached = await Prisma.client.cacheJSON.findUnique({ where: { id, type: type } });
        if (cached) {
            return cached.json as any as T;
        }
        const data = await fetchFn();
        await Prisma.client.cacheJSON.create({
            data: {
                id,
                type,
                json: data as any,
            },
        });
        return data;
    }
}