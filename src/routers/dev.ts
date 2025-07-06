import { Request, Response, Router } from "express";
import AnimePahe from "../core/AnimePahe.js";
import Composer from "../core/Composer.js";
import { Prisma } from "../core/Prisma.js";
import fs from "fs/promises";
const router = Router();

router.get("/dev/", async (_req: Request, _res: Response) => {
  const res = await dev2();
  return _res.json(res);
});

export default router;

async function dev() {
  const res = await Prisma.client.cachedResponse.findMany({
    where: {
      route: {
        contains: "/anime/",
      },
      source: {
        equals: "ANIMEPAHE",
      },
    },
  });
  const airing: string[] = [];
  const fail: string[] = [];
  res.forEach((r) => {
    const id = r.route.split("/").pop();

    if (id) {
      const data = (r?.data as any)?.json;
      const status: string | undefined = data?.info?.status?.toLowerCase();
      if (status && status.includes("currently") && data.id.id) {
        airing.push(id);
      } else if (!status) {
        fail.push(id);
      }
    }
  });
  return { airing, fail };
}
async function dev2() {
  const json = await fs.readFile("src/tmp/response.json", "utf-8");
  const data = JSON.parse(json);
  const airing: string[] = data.airing;
  const total = airing.length;
  let count = 0;
  for (const id of airing) {
    await Composer.updateAnime(id);
    count++;
    // Log progress in green color
    console.log(`\x1b[32m[${count}/${total}] Updated anime: ${id}\x1b[0m`);
  }
}
