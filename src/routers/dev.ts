import { Request, Response, Router } from "express";
import { Indexer } from "../core/Indexer.js";

const router = Router();

router.get("/dev/seed", async (_req: Request, res: Response) => {
  Indexer.seed();
  res.json({
    status: "Started seeding db with all anime.",
  });
});

export default router;
