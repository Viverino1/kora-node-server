import { Request, Response, Router } from "express";
import { Indexer } from "../core/Indexer.js";

const router = Router();

router.get("/seed", async (_req: Request, res: Response) => {
  await Indexer.seed();
  res.json({ status: "Finished seeding." });
});

export default router;
