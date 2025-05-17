import { Hono } from "hono";
import type { AniwatchAPIVariables } from "./config/variables.js";
declare const app: Hono<{
    Variables: AniwatchAPIVariables;
}, import("hono/types").BlankSchema, "/">;
export default app;
