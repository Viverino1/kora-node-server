import { Request, Response, Router } from "express";
import { Jikan } from "../services/jikan.js";

const router = Router();

router.get("/test", async (_req: Request, res: Response) => {
  // const data = await Indexer.getAnime({
  //   id: "Fire%20Force",
  //   session: "ea2cd882-e962-9fce-b066-299427abf79d",
  //   title: "Fire Force",
  // });
  //const data = await AnimePahe.updateAllAnime();
  //const data = await Jikan.getAnimeFromTitle("One Piece Film: Z");
  //const data = await HiAnime.getIdFromTitle("One Piece Film: Z");
  const data = await Jikan._getEpisodes("/anime/22/episodes");
  res.json(data);
});

export default router;
