import { Request, Response, Router } from "express";

const router = Router();

router.get("/anime", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Anime endpoint",
  });
});
