import { Request, Response, Router } from "express";
import { Prisma } from "../core/Prisma.js";

const router = Router();

router.get("/dev/get", async (_req: Request, res: Response) => {
  const data = await Prisma.getAllAnimeIDs();
  return res.json(data);
});

export default router;
