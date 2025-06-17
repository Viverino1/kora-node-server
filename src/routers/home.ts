import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import { Kora } from "../types/api.js";
const router = Router();

router.get("/home", async (_req: Request, res: Response) => {
  const recent = (await AnimePahe.getHome())?.map((a) => a.id) ?? null;
  const response: Kora.Home = {
    recent: recent ?? [],
  };

  res.json(response);
});

export default router;
