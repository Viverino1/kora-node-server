import { config } from "dotenv";
import { Redis } from "ioredis";
config();
export class AniwatchAPICache {
    _client;
    isOptional = true;
    static DEFAULT_CACHE_EXPIRY_SECONDS = 60;
    static CACHE_EXPIRY_HEADER_NAME = "X-ANIWATCH-CACHE-EXPIRY";
    constructor() {
        const redisConnURL = process.env?.ANIWATCH_API_REDIS_CONN_URL;
        this.isOptional = !Boolean(redisConnURL);
        this._client = this.isOptional ? null : new Redis(String(redisConnURL));
    }
    set(key, value) {
        if (this.isOptional)
            return;
        return this._client?.set(key, value);
    }
    get(key) {
        if (this.isOptional)
            return;
        return this._client?.get(key);
    }
    async getOrSet(setCB, key, expirySeconds = AniwatchAPICache.DEFAULT_CACHE_EXPIRY_SECONDS) {
        const cachedData = this.isOptional
            ? null
            : (await this._client?.get(key)) || null;
        let data = JSON.parse(String(cachedData));
        if (!data) {
            data = await setCB();
            await this._client?.set(key, JSON.stringify(data), "EX", expirySeconds);
        }
        return data;
    }
}
export const cache = new AniwatchAPICache();
//# sourceMappingURL=cache.js.map