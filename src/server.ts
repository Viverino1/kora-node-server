import { serve } from "@hono/node-server";
import express from "express";
import hianime from "../external/hianime/dist/src/server.js";
import AnimePahe from "./core/AnimePahe.js";
import { Indexer } from "./core/Indexer.js";
import Puppeteer from "./core/Puppeteer.js";
import anime from "./routers/anime.js";
import dev from "./routers/dev.js";
import health from "./routers/health.js";
export const port = process.env.PORT;
export const aniwatchPort = process.env.ANIWATCH_API_PORT;
export const baseURL = process.env.BASE_URL;
export const jikanBaseURL = process.env.JIKAN_API_BASE_URL;
export const animePaheBaseURL = process.env.ANIMEPAHE_API_BASE_URL;

const app = express();
app.use(express.json());
app.use(health);
app.use(dev);
app.use(anime);

app.listen(port);

serve({ fetch: hianime.fetch });
console.log(`Main server is running on port ${port}`);

await Puppeteer.initialize();
console.log("Puppeteer is initialized");
await AnimePahe.initialize();
console.log("AnimePahe is initialized");
await Indexer.initialize();
console.log("Indexer is initialized");
