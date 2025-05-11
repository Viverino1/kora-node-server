import PQueue from "p-queue";
import AnimePahe from "../core/AnimePahe.js";
import { HiAnime } from "../services/hianime/hianime.js";
import { Jikan } from "../services/jikan.js";

export class Indexer {
  static queue: PQueue = new PQueue({ concurrency: 1 });
  static async initialize() {
    setInterval(() => {}, 1000 * 15);
  }
  static async getAnime(id: AnimePahe.AnimeID) {
    let pahe: AnimePahe.Anime | null = null;
    let hiAnimeId: string | null = null;
    let hiAnime: HiAnime.Anime | null = null;
    let hiAnimeEpisodes: HiAnime.Episode[] | null = null;
    let jikan: Jikan.Anime | null = null;

    pahe = await AnimePahe.getAnime(id);
    if (!pahe || !pahe.title) return null;
    jikan = await Jikan.getAnimeFromTitle(pahe.title);
    hiAnimeId = await HiAnime.getIdFromTitle(pahe.title);
    if (hiAnimeId) {
      hiAnime = await HiAnime.getAnime(hiAnimeId);
      hiAnimeEpisodes = await HiAnime.getEpisodes(hiAnimeId);
    }

    const anime = {
      id,
      hiAnimeId,
      malId: hiAnime?.malId,
      anilistId: hiAnime?.anilistId,
      title: pahe.title,
    };

    return anime;

    // return {
    //   title: pahe.title,
    //   description: pahe.synopsis,
    //   title2: hiAnime?.name,
    //   description2: hiAnime?.description,
    //   title3: jikan?.title,
    //   description3: jikan?.synopsis,
    // };
  }
}
