import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";

const router = Router();

router.get("/anime/:id", async (_req: Request, res: Response) => {
  const { id } = _req.params;
  const anime = await Composer.getAnime(id); // Don't pass options at all
  return res.json(anime);
});

export default router;
