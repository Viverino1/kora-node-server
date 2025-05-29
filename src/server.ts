import { serve } from "@hono/node-server";
import cors from "cors";
import express from "express";
import hianime from "../external/hianime/dist/src/server.js";
import AnimePahe from "./core/AnimePahe.js";
import { Indexer } from "./core/Indexer.js";
import { Prisma } from "./core/Prisma.js";
import Puppeteer from "./core/Puppeteer.js";
import anime from "./routers/anime.js";
import dev from "./routers/dev.js";
import health from "./routers/health.js";
import history from "./routers/history.js";
import home from "./routers/home.js";
import proxy from "./routers/proxy.js";
export const port = process.env.PORT;
export const aniwatchPort = process.env.ANIWATCH_API_PORT;
export const baseURL = process.env.BASE_URL;
export const jikanBaseURL = process.env.JIKAN_API_BASE_URL;
export const animePaheBaseURL = process.env.ANIMEPAHE_API_BASE_URL;
export const clerkSecretKey = process.env.CLERK_SECRET_KEY;
export const clerkIssuer = process.env.CLERK_ISSUER;

const app = express();
app.use(cors()); // Add this line to enable CORS for all origins
app.use(express.json());
app.disable("x-powered-by");
app.use(health);
app.use(dev);
app.use(anime);
app.use(home);
app.use(history);
app.use(proxy);

app.listen(port);

serve({ fetch: hianime.fetch });

await Puppeteer.initialize();
await AnimePahe.initialize();
await Prisma.initialize();
await Indexer.initialize();

console.log(`Main server is running on port ${port}`);
