import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import { Prisma } from "../core/Prisma.js";
import ClerkService from "../services/clerk.js";
import { HiAnime } from "../services/hianime/hianime.js";
import { Kora } from "../types/api.js";
import { encodeStringToId } from "../utils/utils.js";
const router = Router();

router.get("/home", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);

  const recent = (await AnimePahe.getHome())?.map((a) => a.id) ?? null;
  const continueWatchingHistory = userId ? await Prisma.getRecentHistory(userId, 10) : [];
  const history = userId ? continueWatchingHistory.map((e) => e.animeId) : null;

  const hiAnimeHome = await HiAnime.getHome();
  const parse = (data: string[] | undefined) => {
    if (!data) return null;
    return Prisma.findValidIds(data.map((id) => encodeStringToId(id)));
  };
  const spotlight = parse(hiAnimeHome?.spotlightAnimes);
  const trending = parse(hiAnimeHome?.top10Animes.month);
  const popular = parse(hiAnimeHome?.mostPopularAnimes);

  const response: Kora.Home = {
    continueWatching: history ?? [],
    recent: recent ?? [],
    spotlight: spotlight ?? [],
    trending: trending ?? [],
    popular: popular ?? [],
    continueWatchingHistory
  };

  res.json(response);
});

export default router;
