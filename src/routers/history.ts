import { Request, Response, Router } from "express";
import { Prisma } from "../core/Prisma.js";
import ClerkService from "../services/clerk.js";

const router = Router();

router.post("/history", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { animeId, epnum, timestamp } = _req.body;

    await Prisma.setHistory(userId, animeId, epnum, timestamp);

    return res.status(201).json({
      success: true,
      message: "History entry created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create history entry",
    });
  }
});

router.get("/history", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const animeId = _req.query.animeid as string;
    const epnum = _req.query.epnum as string;

    if (!animeId || !epnum) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: animeid and epnum",
      });
    }

    const history = await Prisma.getHistory(userId, animeId, Number(epnum));

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
});

router.get("/history/recent", async (_req: Request, res: Response) => {
  const userId = await ClerkService.getUserFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const limitStr = _req.query.limit as string | undefined;
    const limit = limitStr && limitStr != "undefined" ? Number(limitStr) : undefined;
    const data = await Prisma.getRecentlyWatchedAnime(userId, limit);
    return res.json(data);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
});

export default router;
