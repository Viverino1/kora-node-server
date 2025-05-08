import { serve } from "@hono/node-server";
import express from "express";
import hianime from "../external/hianime/dist/src/server.js";
import Puppeteer from "./core/Puppeteer.js";
import health from "./routers/health.js";
import test from "./routers/test.js";
export const port = process.env.PORT;
export const aniwatchPort = process.env.ANIWATCH_API_PORT;
export const baseURL = process.env.BASE_URL;
export const jikanBaseURL = process.env.JIKAN_API_BASE_URL;

const app = express();
app.use(express.json());
app.use(health);
app.use(test);
await Puppeteer.initialize();
console.log("Puppeteer is initialized");
// await AnimePahe.initialize();
// console.log("AnimePahe is initialized");
app.listen(port);
serve({
  fetch: hianime.fetch,
});
console.log(`Main server is running on port ${port}`);
