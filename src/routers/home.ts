import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
const router = Router();

router.get("/home", async (_req: Request, res: Response) => {
  const data = await AnimePahe.getHome();

  return res.json(data);
});

export default router;
