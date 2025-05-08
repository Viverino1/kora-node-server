import { Request, Response, Router } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  res.json({
    status: "ok",
    message: "Server is running",
    uptime: `${days}:${hours}:${minutes}:${seconds}`,
    memoryUsage: (memoryUsage.rss / 1024 / 1024).toFixed(2) + " MB",
  });
});

export default router;
