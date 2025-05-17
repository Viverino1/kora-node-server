import { Hono } from "hono";
import { HiAnime } from "aniwatch";
import { cache } from "../config/cache.js";
const hianime = new HiAnime.Scraper();
const hianimeRouter = new Hono();
hianimeRouter.get("/", (c) => c.redirect("/", 301));
hianimeRouter.get("/home", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const data = await cache.getOrSet(hianime.getHomePage, cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/azlist/:sortOption", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const sortOption = decodeURIComponent(c.req.param("sortOption").trim().toLowerCase());
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1;
    const data = await cache.getOrSet(async () => hianime.getAZList(sortOption, page), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/qtip/:animeId", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const animeId = decodeURIComponent(c.req.param("animeId").trim());
    const data = await cache.getOrSet(async () => hianime.getQtipInfo(animeId), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/category/:name", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const categoryName = decodeURIComponent(c.req.param("name").trim());
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1;
    const data = await cache.getOrSet(async () => hianime.getCategoryAnime(categoryName, page), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/genre/:name", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const genreName = decodeURIComponent(c.req.param("name").trim());
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1;
    const data = await cache.getOrSet(async () => hianime.getGenreAnime(genreName, page), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/producer/:name", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const producerName = decodeURIComponent(c.req.param("name").trim());
    const page = Number(decodeURIComponent(c.req.query("page") || "")) || 1;
    const data = await cache.getOrSet(async () => hianime.getProducerAnimes(producerName, page), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/schedule", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const date = decodeURIComponent(c.req.query("date") || "");
    const data = await cache.getOrSet(async () => hianime.getEstimatedSchedule(date), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/search", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    let { q: query, page, ...filters } = c.req.query();
    query = decodeURIComponent(query || "");
    const pageNo = Number(decodeURIComponent(page || "")) || 1;
    const data = await cache.getOrSet(async () => hianime.search(query, pageNo, filters), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/search/suggestion", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const query = decodeURIComponent(c.req.query("q") || "");
    const data = await cache.getOrSet(async () => hianime.searchSuggestions(query), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/anime/:animeId", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const animeId = decodeURIComponent(c.req.param("animeId").trim());
    const data = await cache.getOrSet(async () => hianime.getInfo(animeId), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/episode/servers", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const animeEpisodeId = decodeURIComponent(c.req.query("animeEpisodeId") || "");
    const data = await cache.getOrSet(async () => hianime.getEpisodeServers(animeEpisodeId), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/episode/sources", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const animeEpisodeId = decodeURIComponent(c.req.query("animeEpisodeId") || "");
    const server = decodeURIComponent(c.req.query("server") || HiAnime.Servers.VidStreaming);
    const category = decodeURIComponent(c.req.query("category") || "sub");
    const data = await cache.getOrSet(async () => hianime.getEpisodeSources(animeEpisodeId, server, category), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
hianimeRouter.get("/anime/:animeId/episodes", async (c) => {
    const cacheConfig = c.get("CACHE_CONFIG");
    const animeId = decodeURIComponent(c.req.param("animeId").trim());
    const data = await cache.getOrSet(async () => hianime.getEpisodes(animeId), cacheConfig.key, cacheConfig.duration);
    return c.json({ success: true, data }, { status: 200 });
});
export { hianimeRouter };
//# sourceMappingURL=hianime.js.map