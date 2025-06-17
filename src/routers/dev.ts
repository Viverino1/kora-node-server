import { Request, Response, Router } from "express";
import Composer from "../core/Composer.js";
import { promises as fs } from "fs";
import path from "path";
import { Prisma } from "../core/Prisma.js";

const router = Router();

router.get("/dev", async (_req: Request, res: Response) => {
  const devRes = await dev();
  console.log("devRes", devRes);
  return res.json(devRes);
});

export default router;

async function dev() {
  // const sources = await Prisma.client.cachedResponse.findMany({
  //   where: {
  //     source: "ANIMEPAHE",
  //     AND: [
  //       {
  //         route: {
  //           startsWith: "/play/",
  //         },
  //       },
  //     ],
  //   },
  // });

  // return sources.map((source) => source.route.split("/"));

  return await Prisma.client.cachedResponse.deleteMany({
    where: {
      source: "COMPOSER",
      route: {
        startsWith: "image",
      },
    },
  });
}
