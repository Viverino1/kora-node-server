import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";

const router = Router();

router.get("/test", async (_req: Request, res: Response) => {
  const data = await AnimePahe.getAnimeList();
  res.json(data);
});

export default router;
