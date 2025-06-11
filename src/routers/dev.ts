import { Request, Response, Router } from "express";
import PQueue from "p-queue";
import Composer from "../core/Composer.js";
import { Kora } from "../types/api.js";

const router = Router();

const queue = new PQueue({ concurrency: 1 });

router.get("/dev", async (_req: Request, res: Response) => {
  const all = (await Composer.getAllAnime()) ?? [];

  const sorted = all.sort((a, b) => {
    const aPop = a.info.stats.popularity;
    const bPop = b.info.stats.popularity;

    if (aPop == null && bPop == null) return 0;
    if (aPop == null) return 1;
    if (bPop == null) return -1;

    return aPop - bPop;
  });

  let completedCount = 0;
  let totalCount = 0;
  for (const a of sorted) {
    totalCount += a.episodes.length;
  }

  const func = async (a: Kora.Anime, i: number) => {
    const source = await Composer.getSource(null, a, i + 1);
    if (source == null) {
      queue.add(() => func(a, i));
    } else {
      completedCount++;
      console.log("Intro/Outro: ", source.intro.end != null || source.outro.start != null || source.outro.end != null || source.intro.start != null);
      console.log(`${((completedCount / totalCount) * 100).toFixed(2)}% complete`);
    }
  };

  for (const a of sorted) {
    for (let i = 0; i < a.episodes.length; i++) {
      queue.add(() => func(a, i));
    }
  }
  res.send(all.length);
});

export default router;
