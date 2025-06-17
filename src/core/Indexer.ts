import PQueue from "p-queue";
import { HiAnime } from "../services/hianime/hianime.js";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";
import { Kora } from "../types/api.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  private static _busy = false;
  static async initialize() {
    await this._update();
    setInterval(async () => {
      if (this._busy) return;
      this._busy = true;
      await this._update();
      this._busy = false;
    }, 1000 * 60 * 5);
  }
  private static async _update() {
    const updates = await AnimePahe.updateAnimeList();
    if (updates) {
      updates?.createdAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, false));
      });
      updates?.updatedAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, false));
      });
      updates?.deletedAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, false));
      });
    }

    // const cache = await AnimePahe.getHome();
    // const remote = await AnimePahe.getHome({
    //   useCache: false,
    //   animeID: null,
    // });

    // if (cache && remote) {
    //   const cacheIds = new Set(cache.map((a) => a.id));
    //   const newAnimes = remote.filter((a) => !cacheIds.has(a.id));
    //   newAnimes.forEach((a) => {
    //     this.queue.add(() => Composer.getAnime(a, false));
    //   });
    // }

    // await HiAnime.getHome({
    //   animeID: null,
    //   useCache: false,
    // });
  }
}
