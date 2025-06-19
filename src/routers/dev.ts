import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import Composer from "../core/Composer.js";
const router = Router();

router.get("/dev/", async (_req: Request, res: Response) => {
  const devRes = await dev();
  return res.json(devRes);
});

export default router;

async function dev() {
  const animeIds = await AnimePahe.getAnimeList();
  if (!animeIds) return;
  const ids = Array.from(new Set(animeIds.map((anime) => anime.id)));

  for (const [index, id] of ids.entries()) {
    console.log(`${(((index + 1) / ids.length) * 100).toFixed(2)}% - Processing ${animeIds[index].title}`);
    //global.gc!();
    const anime = await Composer.getAnime(id);
    if (anime && anime.data) {
      for (const episode of anime.data.episodes ?? []) {
        Composer.getSource(anime.data, episode.id);
      }
    }
  }
}
