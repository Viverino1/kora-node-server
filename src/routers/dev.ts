import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";
import { Prisma } from "../core/Prisma.js";
import { Source } from "../../dist/lib/prisma/index.js";

const router = Router();

router.get("/dev", async (_req: Request, res: Response) => {
  const devRes = await dev();
  console.log("devRes", devRes);
  return res.json(devRes);
});

export default router;

async function dev() {
  const all = await Composer.getAllAnime();
  return all?.map((a) => a.title);
}
