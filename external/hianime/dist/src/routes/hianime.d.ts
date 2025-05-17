import { Hono } from "hono";
import type { AniwatchAPIVariables } from "../config/variables.js";
declare const hianimeRouter: Hono<{
    Variables: AniwatchAPIVariables;
}, import("hono/types").BlankSchema, "/">;
export { hianimeRouter };
