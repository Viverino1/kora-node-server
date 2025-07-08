import PQueue from "p-queue";
import { HiAnime } from "../services/hianime/hianime.js";
import AnimePahe from "./AnimePahe.js";
import Composer from "./Composer.js";
import { Kora } from "../types/api.js";
import { Prisma } from "./Prisma.js";

export class Indexer {
  public static queue = new PQueue({ concurrency: 1 });
  static async initialize() {
    // (async () => {
    //   while (true) {
    //     await this._update();
    //     await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 5));
    //   }
    // })();
  }
  private static async _update() {
    const all = await this._getAllAnimeListDiff();
    const home = await this._getHomePageDiff();

    const diff = [...new Set([...all, ...home].map((anime) => anime.id))];

    console.log(`Found ${diff.length} anime to update.`);
    await Promise.all(diff.map((id) => this.queue.add(() => Composer.updateAnime(id))));
    await this._updateNullAnime();
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

  private static async _updateNullAnime() {
    const all = await Prisma.client?.cachedResponse.findMany({
      where: {
        source: "ANIMEPAHE",
        route: {
          contains: "/anime/",
        },
      },
    });
    console.log(`Found ${all?.length} cached responses for ANIMEPAHE /anime/ route.`);

    const nullAnime = all.filter((anime) => (anime.data as any)?.json === null).map((item) => item.route.split("/").pop() || item.animeID);
    console.log(`Found ${nullAnime.length} anime with null JSON data.`);

    const ids = (await Prisma.client.animeID.findMany({})).map((item) => item.id);
    console.log(`Found ${ids.length} anime IDs in the database.`);

    for (const [index, id] of nullAnime.entries()) {
      if (id) {
        if (!ids.includes(id)) {
          console.log(`\x1b[33m[${index + 1}/${nullAnime.length}] SKIPPED: ${id} (not in database)\x1b[0m`);
          await Prisma.client.cachedResponse.deleteMany({
            where: {
              route: {
                contains: id,
              },
            },
          });
          continue;
        }
        const anime = await Composer.getAnime(id, false);
        if (anime) {
          console.log(`\x1b[32m[${index + 1}/${nullAnime.length}] SUCCESS: ${id}\x1b[0m`);
        } else {
          console.log(`\x1b[31m[${index + 1}/${nullAnime.length}] FAIL: ${id}\x1b[0m`);
        }
      }
    }
  }
}
