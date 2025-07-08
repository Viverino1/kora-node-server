import { Request, Response, Router } from "express";
const router = Router();

router.get("/dev/", async (_req: Request, _res: Response) => {
  const res = await dev();
  return _res.json(res);
});

export default router;

async function dev() {
  return "Hello, World!";
}
