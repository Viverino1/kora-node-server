import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";
import AnimePahe from "../core/AnimePahe.js";
const router = Router();

router.get("/anime", async (_req: Request, res: Response) => res.json(await AnimePahe.getAnimeList()));

router.get("/anime/:id", async (_req: Request, res: Response) => {
  const { id } = _req.params;
  const anime = (await Composer.getAnime(id))?.data ?? null;
  return res.json(anime);
});

router.get("/anime/:id/:epid", async (_req: Request, res: Response) => {
  const { id, epid } = _req.params;
  const source = await Composer.getSource(id, epid);
  return res.json(source);
});

export default router;
