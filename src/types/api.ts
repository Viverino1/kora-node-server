export namespace Kora {
  export type MediaType = "TV" | "OVA" | "Movie" | "Special" | "ONA" | "Music" | "Unknown";
  export interface Episode {
    number: number;
    session: string;
    title: string | null;
    thumbnail: string | null;
    duration: number | null;
    isFiller: boolean | null;
  }

  export interface Anime {
    id: string;
    session: string;
    hianimeId: string | null;
    malId: number | null;
    anilistId: number | null;
    title: string | null;
    description: string | null;
    poster: string | null;
    trailer: {
      ytid: string | null;
      thumbnail: string | null;
      url: string | null;
    };
    episodes: Kora.Episode[];
    info: {
      titles: {
        english: string;
        romanji: string | null;
        japanese: string | null;
      };
    };
  }
}
