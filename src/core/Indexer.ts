import PQueue from "p-queue";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";
import { Prisma } from "./Prisma.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  private static _busy = false;
  static async initialize() {
    // await this._update();
    // setInterval(async () => {
    //   if (this._busy) return;
    //   await this._update();
    // }, 1000 * 60 * 5);
  }
  private static async _update() {
    console.log(`Running update sequence...`);
    const updates = await AnimePahe.updateAnimeList();
    updates?.createdAnimes.forEach((a) => {
      this.queue.add(() => Composer.getAnime(a));
    });
    updates?.updatedAnimes.forEach((a) => {
      this.queue.add(() => Composer.getAnime(a));
    });
    updates?.deletedAnimes.forEach((a) => {
      this.queue.add(() => Prisma.clearRelatedCache(a.id));
    });
  }

  public static async seed() {
    const updates = await AnimePahe.updateAnimeList();
    if (!updates) return;
    for (const anime of updates?.allUniqueAnimes) {
      const res = await this.queue.add(() => Composer.getAnime(anime));
    }
  }
}
