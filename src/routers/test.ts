import { Request, Response, Router } from "express";
import { Jikan } from "../services/jikan.js";

const router = Router();

router.get("/test", async (_req: Request, res: Response) => {
  const data = await Jikan.getAnimeById(22);
  res.json(data);
});

export default router;
