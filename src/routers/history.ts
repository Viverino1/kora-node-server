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
    const { animeId, epnum, timestamp, duration } = _req.body;

    if (!animeId || !epnum || !timestamp || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: animeId, epnum, timestamp, and duration",
      });
    }

    console.log(`Creating history entry for user ${userId}, animeId ${animeId}, epnum ${epnum}, timestamp ${timestamp}`);

    await Prisma.setHistory(userId, animeId, epnum, timestamp, duration);

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
      try {
        const data = await Prisma.getHistory(userId);
        return res.json(data);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch all history",
        });
      }
    }

    const history = await Prisma.getEpisodeHistory(userId, animeId, Number(epnum));

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
});

export default router;
