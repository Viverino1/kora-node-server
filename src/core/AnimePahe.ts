import PQueue from "p-queue";
import { Source } from "../../dist/lib/prisma/index.js";
import { animePaheBaseURL } from "../server.js";
import { domPreparationScript } from "../utils/scripts.js";
import { encodeStringToId } from "../utils/utils.js";
import { Prisma } from "./Prisma.js";
import Puppeteer from "./Puppeteer.js";

class AnimePahe {
  public static queue = new PQueue({ concurrency: 1 });

  public static get url() {
    return animePaheBaseURL;
  }

  static async initialize() {
    if (!this.url) throw new Error("AnimePahe url is not defined");
    //await this.updateAllAnime();
  }

  private static async _getHome(route: string) {
    const res = await AnimePahe.queue.add(() => Puppeteer.get(AnimePahe.url + route, ["div.episode-snapshot a", "span.episode-title a"]));
    if (!res || !res.content) {
      return null;
    }
    const { content } = res;
    const data = content.querySelectorAll("div.episode");
    const animes = Array.from(data)
      .map((episode) => {
        const episodeSnap = episode.querySelector("div.episode-snapshot a");
        const session = episodeSnap?.getAttribute("href")?.split("/").slice(-2, -1)[0] || "";

        const episodeTitle = episode.querySelector("span.episode-title a");
        const title = episodeTitle?.textContent?.trim() || "";

        const id: AnimePahe.AnimeID = {
          title,
          session,
          id: encodeStringToId(title),
        };

        return id;
      })
      .filter((anime) => {
        return anime.title !== "" && anime.id !== "" && anime.session !== "";
      });
    return animes;
  }

  public static async getHome(useCache: boolean = true) {
    const res = await Prisma.cache("/", Source.ANIMEPAHE, this._getHome, { useCache, animeID: null });
    return res;
  }

  private static async _getAnimeList() {
    const selectors = ["hash", ...[...Array(26)].map((_, i) => String.fromCharCode(65 + i))].map((id) => `div#${id}`);
    const res = await AnimePahe.queue.add(() => Puppeteer.get(`${this.url}/anime`, selectors));
    if (!res || !res.content) {
      return null;
    }
    const { content } = res;
    const data = content.querySelectorAll("div.tab-pane a");
    const animes = Array.from(data)
      .map((anime) => {
        const title = anime.textContent?.trim() || "";
        const session = anime.getAttribute("href")?.split("/").pop() || "";

        const id: AnimePahe.AnimeID = {
          title,
          session,
          id: encodeStringToId(title),
        };
        return id;
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
      animes: uniqueAnimes,
      duplicateAnimes,
    };
  }

  public static async getAnimeList(useCache: boolean = true) {
    if (useCache) {
      const cache = await Prisma.client.animeID.findMany();
      return cache.map(({ title, id, session }) => {
        return { title, id, session } as AnimePahe.AnimeID;
      });
    }
    const fresh = (await this._getAnimeList())?.animes ?? null;
    if (!fresh || fresh.length == 0) return null;

    await Prisma.client.animeID.deleteMany({});
    await Prisma.client.animeID.createMany({
      data: fresh,
    });
    return fresh;
  }

  private static async _getAnime(id: AnimePahe.AnimeID, route: string) {
    const res = await AnimePahe.queue.add(() => Puppeteer.get(`${AnimePahe.url}/anime/${id.session}?page=1`, ["div.episode-snapshot img", "div.episode-snapshot a", "div.anime-poster a"]));
    if (!res || !res.content) {
      return null;
    }
    const { content } = res;

    const cache = await Prisma.getFromCache<AnimePahe.Anime | null>(route, Source.ANIMEPAHE);

    const poster = content.querySelector("div.anime-poster a")?.getAttribute("href") || null;

    const infoElements = Array.from(content.querySelectorAll("div.anime-info p"));
    const infoData = {
      synonyms: null as string[] | null,
      type: null as string | null,
      totalEpisodeCount: null as number | null,
      status: null as string | null,
      duration: null as number | null,
      aired: { start: null as string | null, end: null as string | null },
      season: null as string | null,
      studio: null as string | null,
      themes: null as string[] | null,
      japanese: null as string | null,
    };

    infoElements.forEach((info) => {
      const text = info.textContent?.trim() || "";

      if (text.startsWith("Synonyms:")) {
        infoData.synonyms = text
          .replace("Synonyms:", "")
          .trim()
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (text.startsWith("Japanese:")) {
        infoData.japanese = text.replace("Japanese:", "").trim();
      } else if (text.startsWith("Type:")) {
        infoData.type = text.replace("Type:", "").trim();
      } else if (text.startsWith("Episodes:")) {
        const eps = parseInt(text.replace("Episodes:", "").trim());
        infoData.totalEpisodeCount = isNaN(eps) ? null : eps;
      } else if (text.startsWith("Status:")) {
        infoData.status = text.replace("Status:", "").trim();
      } else if (text.startsWith("Duration:")) {
        const mins = parseInt(text.replace("Duration:", "").replace("minutes", "").trim());
        infoData.duration = isNaN(mins) ? null : mins;
      } else if (text.startsWith("Aired:")) {
        const dateText = text.replace("Aired:", "").trim();
        const [start, end] = dateText.split("to").map((d) => d.trim());
        infoData.aired = {
          start: new Date(start).toISOString().split("T")[0],
          end: !end || end === "?" ? null : new Date(end)?.toISOString()?.split("T")[0],
        };
      } else if (text.startsWith("Season:")) {
        infoData.season = text.replace("Season:", "").trim();
      } else if (text.startsWith("Studio:")) {
        infoData.studio = text.replace("Studio:", "").trim();
      } else if (text.startsWith("Theme:") || text.startsWith("Themes:")) {
        infoData.themes = text
          .replace(/Themes?:/, "") // Use regex to match either Theme: or Themes:
          .trim()
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter(Boolean);
      }
    });

    const genreElements = Array.from(content.querySelectorAll("div.anime-genre a"));
    const genres = genreElements.map((genre) => genre.getAttribute("href")?.split("/").pop() || null);

    const title = content.querySelector("div.title-wrapper span")?.textContent?.trim() || null;

    if (!title) {
      return null;
    }

    const cachedEpisodeCount = cache?.episodes.length;
    const maxPagesString = content.querySelector('a[title="Go to the Last Page"]')?.getAttribute("data-page");
    const maxPages = maxPagesString ? Number(maxPagesString) : 1;
    let episodes: AnimePahe.Episode[] = [];

    const startPage = Math.min(!cachedEpisodeCount ? 1 : Math.floor(cachedEpisodeCount / 30) + 1, maxPages);

    const reverse = infoData.status?.toLowerCase().includes("currently") ?? false;

    for (let i = startPage; i <= maxPages; i++) {
      const pageNumber = reverse ? maxPages - i + 1 : i;
      console.log(`Fetching page ${pageNumber} of ${maxPages} for anime ${id.title}`);
      const r = pageNumber == 1 ? res : await AnimePahe.queue.add(() => Puppeteer.get(`${AnimePahe.url}/anime/${id.session}?page=${pageNumber}`, ["div.episode-snapshot img", "div.episode-snapshot a", "div.anime-poster a"]));
      if (!r || !r.content) {
        return null;
      }
      const { content } = r;
      const data = content.querySelectorAll("div.episode");
      const eps = Array.from(data).map((episode) => {
        const thumbnail = episode.querySelector("div.episode-snapshot img")?.getAttribute("data-src") || null;

        const durationText = episode.querySelector("div.episode-label-wrap div.episode-label div.episode-title-wrap span")?.textContent ?? null;
        const durationParts = durationText ? durationText.split(":").map(Number) : [0, 0, 0];
        const duration = durationParts ? Math.round(durationParts[0] * 60 + durationParts[1] + durationParts[2] / 60) : null;

        const href = episode.querySelector("div.episode-snapshot a")?.getAttribute("href") || null;
        const session = href ? href?.split("/")?.pop() ?? null : null;

        const episodeNumberString = episode.querySelector("div.episode-number")?.textContent?.toLocaleLowerCase().replace("episode", "").trim() ?? null;

        const ep: AnimePahe.Episode = {
          session,
          thumbnail,
          number: episodeNumberString ?? "",
          duration,
        };

        return ep;
      });

      if (eps.length === 0) {
        return null;
      }

      if (reverse) eps.reverse();

      episodes = episodes.concat(eps);
    }

    const cachedEpisodes = cache?.episodes || [];

    const cachedEpisodeNumbers = new Set(cachedEpisodes.map((ep) => ep.number));
    const newEpisodes = episodes.filter((ep) => !cachedEpisodeNumbers.has(ep.number));

    episodes = cachedEpisodes.concat(newEpisodes);

    const anime: AnimePahe.Anime = {
      id: {
        title,
        session: id.session,
        id: encodeStringToId(title),
      },
      title,
      poster,
      synopsis: content.querySelector("div.anime-content")?.querySelector("div.anime-synopsis")?.textContent?.trim() || null,
      episodes,
      info: {
        ...infoData,
        genres,
        episodeCount: episodes.length,
      },
    };

    return anime;
  }

  public static async getAnime(id: AnimePahe.AnimeID, options: Prisma.CacheOptions = Prisma.defaultCacheOptions) {
    options.animeID = id.id;
    const data = await Prisma.cache(`/anime/${id.id}`, Source.ANIMEPAHE, (route) => this._getAnime(id, route), options);
    return data;
  }

  public static async _getSource(animeSession: string, episodeSession: string) {
    const url = new URL(`/play/${animeSession}/${episodeSession}`, AnimePahe.url);
    const res = await AnimePahe.queue.add(() => Puppeteer.get(url.href, "div#resolutionMenu button"));
    if (!res || !res.content) {
      return null;
    }
    const { content } = res;
    const data = content.querySelectorAll("div#resolutionMenu button");

    const streams = Array.from(data).map((button) => ({
      text: button.textContent?.trim()?.split("·")[0]?.trim() || null, // Get only the part before '·'
      resolution: parseInt(button.getAttribute("data-resolution") || "0", 10),
      url: button.getAttribute("data-src"),
    }));

    streams.sort((a, b) => b.resolution - a.resolution);
    const stream = streams[0];

    if (!stream || !stream.url) {
      throw new Error("No stream found");
    }

    const uri = new URL(stream.url);
    const requestURL = uri.href.replace("/f/", "/e/");

    const scripts = [domPreparationScript, `new Promise(resolve => resolve(hls.url));`];

    const { scriptResults: results } = await Puppeteer.get(requestURL, [], AnimePahe.url, scripts);

    const streamUrl: string = String(results.pop());

    if (!stream.url || !stream.text) {
      return null;
    }

    const source: AnimePahe.Source = {
      streamUrl: streamUrl,
      referer: stream.url,
      source: stream.text,
      resolution: stream.resolution,
    };

    console.log(`Got source: ${source.streamUrl}`);
    return source;
  }

  public static async getSource(id: string, aSesh: string, epid: string, eSesh: string, options = Prisma.defaultCacheOptions) {
    options.animeID = id;
    const route = `/play/${id}/${epid}`;
    const data = await Prisma.cache(route, Source.ANIMEPAHE, () => this._getSource(aSesh, eSesh), options);
    return data?.data ?? null;
  }
}

namespace AnimePahe {
  export type AnimeID = {
    title: string;
    session: string;
    id: string;
  };

  export type EpisodeID = {
    animeID: AnimeID;
    session: string;
    number: number;
  };

  export type Episode = {
    session: string | null;
    thumbnail: string | null;
    number: string;
    duration: number | null;
  };

  export type Anime = {
    id: AnimeID;
    title: string | null;
    poster: string | null;
    synopsis: string | null;
    episodes: Episode[];
    info: {
      synonyms: string[] | null;
      type: string | null;
      totalEpisodeCount: number | null;
      status: string | null;
      duration: number | null;
      aired: {
        start: string | null;
        end: string | null;
      };
      season: string | null;
      studio: string | null;
      themes: string[] | null;
      japanese: string | null;
      genres: (string | null)[];
      episodeCount: number;
    };
  };

  export type Source = {
    streamUrl: string;
    referer: string;
    source: string;
    resolution: number;
  };
}

export { AnimePahe };
export default AnimePahe;
