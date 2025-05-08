import { HiAnime as HiAnimeTypes } from "aniwatch";

import { aniwatchPort, baseURL } from "../server.js";

export class HiAnime {
  static _url = `${baseURL}:${aniwatchPort}/api/v2/hianime`;
}

export namespace HiAnime {
  type Outro = {
    start: number | undefined;
    end: number | undefined;
  };

  type Track = {
    file: string;
    label: string;
    kind: string;
    default: boolean;
  };

  export type EpisodeSources = HiAnimeTypes.ScrapedAnimeEpisodesSources & {
    outro: Outro | undefined;
    tracks: Track[] | undefined;
  };
}
