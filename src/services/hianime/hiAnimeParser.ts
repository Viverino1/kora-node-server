import { HiAnime as HiAnimeTypes } from "aniwatch";
import { encodeQueryParameter, ensureNotZero, extractStartEndDates, sanitizeDescription, splitStringToStringArray, stringOrNullToNumberOrNull, stringOrStringArrayToString, stringOrStringArrayToStringArray, stringToStatus, timeStringToMinutes } from "../../utils/utils.js";
import { HiAnime } from "./hianime.js";

export default class HiAnimeParser {
  public static async anime(scrapedData: HiAnimeTypes.ScrapedAnimeAboutInfo): Promise<HiAnime.Anime> {
    const { recommendedAnimes, seasons, anime } = scrapedData;
    const { info, moreInfo } = anime;
    const { id, anilistId, malId, name, poster, description, stats } = info;
    const { rating, quality, episodes, type, duration } = stats;
    const { premiered, status, malscore, genres, studios, producers, aired } = moreInfo;

    const [startDate, endDate] = extractStartEndDates(aired);

    const animeResponse: HiAnime.Anime = {
      id: id ?? "",
      anilistId: ensureNotZero(anilistId),
      malId: ensureNotZero(malId),
      name,
      poster,
      description: sanitizeDescription(description),
      rating,
      quality,
      episodeCount: episodes.sub ?? 0,
      type,
      duration: timeStringToMinutes(duration),
      startDate,
      endDate,
      season: stringOrStringArrayToString(premiered),
      status: stringToStatus(stringOrStringArrayToString(status)),
      malscore: stringOrNullToNumberOrNull(stringOrStringArrayToString(malscore)),
      genres: genres ? stringOrStringArrayToStringArray(genres) : [],
      studios: studios ? splitStringToStringArray(stringOrStringArrayToString(studios)) : [],
      producers: producers ? stringOrStringArrayToStringArray(producers) : [],
      recommendedAnime: recommendedAnimes
        .map((data) => {
          const { id, name, poster, episodes, type } = data;
          if (id === null) {
            return null;
          }
          let anime: HiAnime.MinimalAnimeInfo = {
            id,
            name,
            poster,
            episodeCount: episodes.sub ?? 0,
            type,
          };
          return anime;
        })
        .filter((id) => id !== null),
      related: seasons
        .map((season) => {
          const { id, name, poster, title } = season;
          if (id === null) {
            return null;
          }
          let related: HiAnime.MinimalAnimeInfo = {
            id,
            name,
            poster,
            episodeCount: null,
            type: title,
          };
          return related;
        })
        .filter((id) => id !== null),
    };

    return animeResponse;
  }

  public static async episodes(scrapedData: HiAnimeTypes.ScrapedAnimeEpisodes): Promise<HiAnime.Episode[]> {
    const { episodes } = scrapedData;
    return episodes
      .map((episode) => {
        if (episode.episodeId === null) {
          return null;
        }
        const normalizedEpisode: HiAnime.Episode = {
          id: encodeQueryParameter(episode.episodeId),
          title: episode.title,
          number: episode.number,
          isFiller: episode.isFiller,
        };
        return normalizedEpisode;
      })
      .filter((ep): ep is HiAnime.Episode => ep !== null);
  }

  public static async source(scrapedData: HiAnime.ScrapedEpisodeSources): Promise<HiAnime.Source> {
    const url: string = scrapedData.sources[0].url;
    const referer: string | null = scrapedData.headers?.Referer ?? null;

    // Check for English subtitles
    const englishSub = scrapedData.tracks?.find((track) => track.label === "English")?.file || null;

    const sourceResponse: HiAnime.Source = {
      url,
      referer,
      introStart: scrapedData.intro?.start ?? null,
      introEnd: scrapedData.intro?.end ?? null,
      outroStart: scrapedData.outro?.start ?? null,
      outroEnd: scrapedData.outro?.end ?? null,
      subs: englishSub, // Return English subtitle if available, otherwise null
    };

    return sourceResponse;
  }
}
