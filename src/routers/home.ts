import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import Composer from "../core/Composer.js";
import { Prisma } from "../core/Prisma.js";
import ClerkService from "../services/clerk.js";
const router = Router();

router.get("/home", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);
  // if (!userId) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  const data = await AnimePahe.getHome();

  const homePageAnime = await Promise.all(data?.map((anime) => Composer.getAnime(anime)) || []);
  const recentlyWatched = !userId ? [] : await Prisma.getRecentlyWatchedAnime(userId, 5);

  return res.json([...recentlyWatched, ...homePageAnime]);
});

export default router;
