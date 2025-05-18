import PQueue from "p-queue";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  private static _busy = false;
  static async initialize() {
    //await this._update();
    setInterval(async () => {
      if (this._busy) return;
      await this._update();
    }, 1000 * 60 * 5);
  }
  private static async _update() {
    console.log(`Running update sequence...`);
    const cache = await AnimePahe.getHome();
    const remote = await AnimePahe.getHome({
      useCache: false,
      animeID: null,
    });

    if (cache && remote) {
      const cacheIds = new Set(cache.map((a) => a.id));
      const newAnimes = remote.filter((a) => !cacheIds.has(a.id));
      console.log(`Found ${newAnimes.length} new animes on home page: ${newAnimes.map((a) => a.title).join("\n ")}`);
      newAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, undefined, false));
      });
    }

    const updates = await AnimePahe.updateAnimeList();
    if (updates) {
      console.log(`Found ${updates.updatedAnimes.length + updates.createdAnimes.length} animes to update: ${[...updates.updatedAnimes, ...updates.createdAnimes].map((a) => a.title).join("\n ")}`);
      updates?.createdAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, undefined, false));
      });
      updates?.updatedAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, undefined, false));
      });
      updates?.deletedAnimes.forEach((a) => {
        this.queue.add(() => Composer.getAnime(a, undefined, undefined, false));
      });
    }
  }

  public static async seed() {
    const updates = await AnimePahe.updateAnimeList();
    if (!updates) return;
    for (const anime of updates?.allUniqueAnimes) {
      const res = await this.queue.add(() => Composer.getAnime(anime));
    }
  }
}
