import PQueue from "p-queue";
import { HiAnime } from "../services/hianime/hianime.js";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  static async initialize() {
    //await this._update();
    // setInterval(async () => {
    //   if (this._busy) return;
    //   await this._update();
    // }, 1000 * 60 * 5);
  }
  private static async _update() {
    const cache = await AnimePahe.getHome();
    const remote = await AnimePahe.getHome({
      useCache: false,
      animeID: null,
    });

    if (cache && remote) {
      const cacheIds = new Set(cache.map((a) => a.id));
      const newAnimes = remote.filter((a) => !cacheIds.has(a.id));
      newAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, false));
      });
    }

    const updates = await AnimePahe.updateAnimeList();
    if (updates) {
      updates?.createdAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, false));
      });
      updates?.updatedAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, false));
      });
      updates?.deletedAnimes.forEach((a: AnimePahe.AnimeID) => {
        this.queue.add(() => Composer.getAnime(a, undefined, false));
      });
    }

    await HiAnime.getHome({
      animeID: null,
      useCache: false,
    });
  }
}
