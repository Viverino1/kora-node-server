import { config } from "dotenv";
import { AniwatchAPICache } from "../config/cache.js";
config();
export const cacheControlMiddleware = async (c, next) => {
    const sMaxAge = process.env.ANIWATCH_API_S_MAXAGE || "60";
    const staleWhileRevalidate = process.env.ANIWATCH_API_STALE_WHILE_REVALIDATE || "30";
    c.header("Cache-Control", `s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    await next();
};
export function cacheConfigSetter(keySliceIndex) {
    return async (c, next) => {
        const { pathname, search } = new URL(c.req.url);
        c.set("CACHE_CONFIG", {
            key: `${pathname.slice(keySliceIndex) + search}`,
            duration: Number(c.req.header(AniwatchAPICache.CACHE_EXPIRY_HEADER_NAME) ||
                AniwatchAPICache.DEFAULT_CACHE_EXPIRY_SECONDS),
        });
        await next();
    };
}
//# sourceMappingURL=cache.js.map