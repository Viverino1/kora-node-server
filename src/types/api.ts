export namespace Kora {
  export interface History {
    lastUpdated: string;
    epid: string;
    animeId: string;
    lastTimeStamp: number;
    duration: number;
  }

  export interface Episode {
    id: string;
    epStr: string;
    num: number;
    index: number;
    session: string;
    hiAnimeEpisodeId: string | null;
    title: string | null;
    thumbnail: string | null;
    duration: number | null;
    isFiller: boolean | null;
  }

  export interface Source extends Episode {
    streamUrl: string;
    proxiedStreamUrl: string;
    referer: string | null;
    source: string;
    resolution: number | null;
    intro: {
      start: number | null;
      end: number | null;
    };
    outro: {
      start: number | null;
      end: number | null;
    };
    backup: {
      url: string;
      referer: string;
      subs: string;
    } | null;
  }
  export interface Anime {
    id: string;
    session: string;
    hiAnimeId: string | null;
    malId: number | null;
    anilistId: number | null;
    title: string;
    description: string | null;
    poster: string | null;
    trailer: {
      ytid: string | null;
      thumbnail: string | null;
      url: string | null;
    };
    episodes: Episode[];
    info: {
      titles: {
        english: string;
        romanji: string | null;
        japanese: string | null;
      };
      mediaType: string | null; //TODO: type this.
      source: string | null; //TODO: type this.
      episodes: number;
      studios: string[];
      producers: string[];
      licensors: string[];
      status: string | null; //TODO: type this.
      airing: boolean | null;
      aired: {
        from: string | null;
        to: string | null;
      };
      duration: number | null;
      stats: {
        score: number | null;
        scoredBy: number | null;
        rank: number | null;
        popularity: number | null;
        members: number | null;
        favorites: number | null;
      };
      season: string | null; //TODO: type this.
      year: number | null;
      broadcast: {
        day: string | null;
        time: string | null;
        timezone: string | null;
      };
      genres: string[];
    };
  }

  export type Home = string[];

  export interface User {
    uid: string;
    email?: string;
    pfp?: string;
  }

  export type Immutable = Anime | Episode | Source | User | Home;
  export type Mutable = History;
  export type Any = Immutable | Mutable;
  export type Type = "anime" | "episode" | "source" | "user" | "history" | "home";
}
