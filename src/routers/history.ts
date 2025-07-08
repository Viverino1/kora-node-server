import { Request, Response, Router } from "express";
import { Prisma } from "../core/Prisma.js";
import { firebaseAuth } from "../middleware/firebaseAuth.js";
import { getUserIdFromRequest } from "../services/firebase/firebase.js";
const router = Router();

router.post("/history", firebaseAuth, async (_req: Request, res: Response) => {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { animeId, epid, timestamp, duration } = _req.body;

    if (!animeId || !epid || !timestamp || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: animeId, epid, timestamp, and duration",
      });
    }

    console.log(`Creating history entry for user ${userId}, animeId ${animeId}, epid ${epid}, timestamp ${timestamp}`);

    await Prisma.setHistory(userId, animeId, epid, timestamp, duration);

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

router.get("/history", firebaseAuth, async (_req: Request, res: Response) => {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const animeId = _req.query.animeid as string;
    const epid = _req.query.epid as string;

    if (!animeId || !epid) {
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

    const history = await Prisma.getEpisodeHistory(userId, animeId, epid);

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history",
    });
  }
});

router.delete("/history", firebaseAuth, async (_req: Request, res: Response) => {
  const userId = await getUserIdFromRequest(_req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const animeId = _req.query.animeid as string;
    console.log(`Deleting history for user ${userId}, animeId ${animeId}`);
    await Prisma.client.history.deleteMany({
      where: {
        uid: userId,
        animeId: animeId,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to delete history",
    });
  }
});

export default router;
