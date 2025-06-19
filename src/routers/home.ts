import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import { Kora } from "../types/api.js";
import Composer from "../core/Composer.js";
const router = Router();

router.get("/home", async (_req: Request, res: Response) => {
  const recent = (await AnimePahe.getHome())?.data?.map((a) => a.id) ?? [];

  const filtered: string[] = [];
  for (const id of recent) {
    const anime = await Composer.getAnime(id);
    if (anime) {
      filtered.push(id);
    }
  }

  const response: Kora.Home = {
    recent: filtered,
  };

  res.json(response);
});

export default router;
