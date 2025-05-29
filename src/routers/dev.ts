import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";
import { Prisma } from "../core/Prisma.js";
import { Kora } from "../types/api.js";

const router = Router();

router.get("/dev", async (_req: Request, res: Response) => {
  const all = await Prisma.getAllAnimeIDs();
  const animes = new Set<Kora.Anime>();
  for (const id of all.keys()) {
    const anime = await Composer.getAnime(id);
    anime && animes.add(anime);
  }
  const arr = Array.from(animes);
  const sorted = arr.sort((a, b) => {
    const aPop = a.info.stats.popularity;
    const bPop = b.info.stats.popularity;

    if (aPop == null && bPop == null) return 0;
    if (aPop == null) return 1;
    if (bPop == null) return -1;

    return aPop - bPop;
  });
  for (const a of sorted) {
    for (let i = 0; i < a.episodes.length; i++) {
      await Composer.getSource(null, a, i + 1);
    }
  }
  res.sendStatus(200);
});

export default router;
