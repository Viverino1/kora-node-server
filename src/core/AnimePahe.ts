import Puppeteer from "./Puppeteer.js";

export default class AnimePahe {
  private static readonly _url = "https://animepahe.ru";

  static async initialize() {
    await Puppeteer.get(this._url);
  }

  static async getHomePage() {}

  static async getAnimeList() {
    const selectors = ["hash", ...[...Array(26)].map((_, i) => String.fromCharCode(65 + i))].map((id) => `div#${id}`);
    const content = await Puppeteer.get(`${this._url}/anime`, selectors);
    const data = content.querySelectorAll("div.tab-pane a");
    const animes = Array.from(data)
      .map((anime) => {
        const title = anime.textContent?.trim() || "";
        const session = anime.getAttribute("href")?.split("/").pop() || "";
        return {
          title,
          session,
          id: encodeURIComponent(title),
        };
      })
      .filter((anime) => {
        return anime.title !== "" && anime.id !== "" && anime.session !== "";
      });

    // Create a map to count occurrences of each ID
    const idCount: Record<string, number> = animes.reduce((acc: any, anime) => {
      acc[anime.id] = (acc[anime.id] || 0) + 1;
      return acc;
    }, {});

    // Create an array with all duplicate animes
    const duplicateAnimes = animes.filter((anime) => idCount[anime.id] > 1);

    // Filter out all duplicates, keeping only entries with unique IDs
    const uniqueAnimes = animes.filter((anime) => idCount[anime.id] === 1);

    return {
      count: uniqueAnimes.length,
      animes: uniqueAnimes,
      duplicateAnimes,
    };
  }
}
