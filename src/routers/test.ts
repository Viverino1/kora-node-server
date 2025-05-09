import { Request, Response, Router } from "express";
import { Jikan } from "../services/jikan.js";
import AnimePahe from "../core/AnimePahe.js";
import { HiAnime } from "../services/hianime/hianime.js";

const router = Router();

router.get("/test", async (_req: Request, res: Response) => {
  const data = await AnimePahe.getAllAnime();
  // const data = await Jikan.getAnimeById(1);
  res.json(data);
});

export default router;
