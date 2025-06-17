import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";
import { Prisma } from "../core/Prisma.js";
import ClerkService from "../services/clerk.js";

const router = Router();

router.get("/anime", async (_req: Request, res: Response) => {
  const data = await Prisma.getAllAnimeIDs();
  return res.json(Array.from(data));
});

router.get("/anime/:id", async (_req: Request, res: Response) => {
  const { id } = _req.params;
  const anime = (await Composer.getAnime(id))?.data ?? null;
  return res.json(anime);
});

router.get("/anime/:id/:epid", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);
  // if (!userId) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  const { id, epid } = _req.params;
  const source = await Composer.getSource(userId, id, epid);
  return res.json(source);
});

export default router;
