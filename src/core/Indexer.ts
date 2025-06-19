import PQueue from "p-queue";
import { HiAnime } from "../services/hianime/hianime.js";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";
import { Kora } from "../types/api.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  private static _busy = false;
  static async initialize() {
    //await this._update();
    // setInterval(async () => {
    //   if (this._busy) return;
    //   this._busy = true;
    //   await this._update();
    //   this._busy = false;
    // }, 1000 * 60 * 5);
  }
  private static async _update() {
    const all = await this._getAllAnimeListDiff();
    const home = await this._getHomePageDiff();

    const diff = [...new Set([...all, ...home].map((anime) => anime.id))];

    console.log(`Found ${diff.length} anime to update.`);
    diff.forEach((id) => this.queue.add(() => Composer.updateAnime(id)));
  }

  private static async _getHomePageDiff() {
    const cache = await AnimePahe.getHome();
    const fresh = await AnimePahe.getHome(false);
    if (!cache || !fresh || !fresh.data || fresh.data.length === 0) {
      return [];
    }

    const cachedIds = cache?.fromCache ? cache.data ?? [] : [];
    const freshIds = fresh.data;
    return freshIds.filter((anime) => !cachedIds.find((a) => a.id === anime.id && a.session === anime.session));
  }

  private static async _getAllAnimeListDiff() {
    const cached = await AnimePahe.getAnimeList();
    const fresh = await AnimePahe.getAnimeList(false);
    if (!cached || !fresh) {
      return [];
    }
    return fresh.filter((anime) => !cached.find((a) => a.id === anime.id && a.session === anime.session));
  }
}
