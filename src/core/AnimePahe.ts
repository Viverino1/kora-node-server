import { domPreparationScript } from "../utils/scripts.js";
import Puppeteer from "./Puppeteer.js";

export default class AnimePahe {
  private static readonly _url = "https://animepahe.ru";

  static async initialize() {
    await Puppeteer.get(this._url);
  }

  static async getHome() {
    const { content } = await Puppeteer.get(this._url, ["div.episode-snapshot a", "span.episode-title a"]);
    const data = content.querySelectorAll("div.episode");
    const animes = Array.from(data)
      .map((episode) => {
        const episodeSnap = episode.querySelector("div.episode-snapshot a");
        const session = episodeSnap?.getAttribute("href")?.split("/").slice(-2, -1)[0] || "";

        const episodeTitle = episode.querySelector("span.episode-title a");
        const title = episodeTitle?.textContent?.trim() || "";

        const id: AnimePahe.AnimeId = {
          title,
          session,
          id: encodeURIComponent(title),
        };

        return id;
      })
      .filter((anime) => {
        return anime.title !== "" && anime.id !== "" && anime.session !== "";
      });
    return animes;
  }

  static async getAllAnime() {
    const selectors = ["hash", ...[...Array(26)].map((_, i) => String.fromCharCode(65 + i))].map((id) => `div#${id}`);
    const { content } = await Puppeteer.get(`${this._url}/anime`, selectors);
    const data = content.querySelectorAll("div.tab-pane a");
    const animes = Array.from(data)
      .map((anime) => {
        const title = anime.textContent?.trim() || "";
        const session = anime.getAttribute("href")?.split("/").pop() || "";

        const id: AnimePahe.AnimeId = {
          title,
          session,
          id: encodeURIComponent(title),
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

  static async getAnime(session: string) {
    const { content } = await Puppeteer.get(`${this._url}/anime/${session}`, ["div.episode-snapshot img", "div.episode-snapshot a", "div.anime-poster a"]);
    const data = content.querySelectorAll("div.episode");
    const episodes = Array.from(data).map((episode, i, arr) => {
      const thumbnail = episode.querySelector("div.episode-snapshot img")?.getAttribute("data-src") || null;

      const durationText = episode.querySelector("div.episode-label-wrap div.episode-label div.episode-title-wrap span")?.textContent ?? null;
      const durationParts = durationText ? durationText.split(":").map(Number) : [0, 0, 0];
      const duration = durationParts ? Math.round(durationParts[0] * 60 + durationParts[1] + durationParts[2] / 60) : null;

      const href = episode.querySelector("div.episode-snapshot a")?.getAttribute("href") || null;
      const session = href ? href?.split("/")?.pop() ?? null : null;

      const ep: AnimePahe.Episode = {
        session,
        thumbnail,
        number: arr.length - i,
        duration,
      };

      return ep;
    });

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
          end: end === "?" ? null : new Date(end).toISOString().split("T")[0],
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
    const anime: AnimePahe.Anime = {
      id: {
        title,
        session,
        id: encodeURIComponent(title),
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

  static async getSource(animeSession: string, episodeSession: string) {
    const url = new URL(`/play/${animeSession}/${episodeSession}`, this._url);
    const { content } = await Puppeteer.get(url.href, "div#resolutionMenu button");
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

    const { scriptResults: results } = await Puppeteer.get(requestURL, [], this._url, scripts);

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

    return source;
  }
}

export namespace AnimePahe {
  export type AnimeId = {
    title: string;
    session: string;
    id: string;
  };

  export type Episode = {
    session: string | null;
    thumbnail: string | null;
    number: number;
    duration: number | null;
  };

  export type Anime = {
    id: AnimeId;
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
