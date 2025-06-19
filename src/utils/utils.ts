import crypto from "crypto";
import { baseURL, port } from "../server.js";
import { HiAnime } from "../services/hianime/hianime.js";
import axios from "axios";
import { Prisma } from "../core/Prisma.js";
import { Source } from "../../dist/lib/prisma/index.js";

export function ensureNotZero(value: number | null): number | null {
  return value === 0 ? null : value;
}

export function stringOrStringArrayToString(aired: string | string[]): string | null {
  const value = Array.isArray(aired) ? aired[0] : aired;
  return value && value.trim() !== "" ? value : null;
}

export function extractStartEndDates(aired: string | string[]): [string | null, string | null] {
  const airedStr = stringOrStringArrayToString(aired);
  if (!airedStr) return [null, null];
  return airedStr.split(" to ").map((dateStr: string) => {
    try {
      const date = new Date(dateStr.trim());
      return date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : null;
    } catch {
      return null;
    }
  }) as [string | null, string | null];
}

export function sanitizeDescription(description: string | null): string | null {
  if (!description) return null;
  const normalizedDescription = description.replace(/\n+/g, " ");
  if (/season of \./i.test(normalizedDescription.trim())) return null;
  return normalizedDescription;
}

export function splitStringToStringArray(value: string | null): string[] {
  if (value === null) {
    return [];
  } else {
    return value.split(/\s*,\s*/).filter(Boolean);
  }
}

/**
 * Extracts the first number from a string, or returns null if input is null or no number is found.
 * @param value string or null
 * @returns number or null
 */
export function stringOrNullToNumberOrNull(value: string | null): number | null {
  if (value === null) return null;
  // Match a number with optional decimal part
  const match = value.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

export function stringOrStringArrayToStringArray(aired: string | string[]): string[] {
  const value = Array.isArray(aired) ? aired : [aired];
  return value.map((s) => s?.trim()).filter((s) => s !== "");
}
/**
 * Converts a string to a Status type ("upcoming" | "airing" | "finished" | null)
 * Matches are case-insensitive and trims whitespace. Returns null if no match.
 */
export function stringToStatus(str: string | null | undefined): HiAnime.Status {
  if (!str) return null;
  const normalized = str.trim().toLowerCase();
  if (["upcoming", "not yet aired"].includes(normalized)) return "upcoming";
  if (["airing", "currently airing"].includes(normalized)) return "airing";
  if (["finished", "completed", "ended", "finished airing"].includes(normalized)) return "finished";
  return null;
}

export function toMinimalAnimeInfoArray(data: any[]) {
  return data
    .map((e) => {
      if (e.id === null) {
        return null;
      }

      const anime: HiAnime.MinimalAnimeInfo = {
        id: e.id,
        name: e.name,
        poster: e.poster,
        episodeCount: e.episodes?.sub ?? null,
        type: e.type ? e.type.split(" (")[0].trim() : null,
      };

      return anime;
    })
    .filter((id) => id !== null);
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function doesMatch(x: string, y: (string | null) | (string | null)[]) {
  const first = slugify(x);
  const targets = Array.isArray(y) ? y.map((str) => slugify(str ?? "")) : [slugify(y ?? "")];

  return targets.some((target) => first === target);
}

export function timeStringToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;

  const hours = timeStr.match(/(\d+)\s*(?:hr|h)/);
  const minutes = timeStr.match(/(\d+)\s*(?:min|m)/);

  const totalMinutes = (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);

  return totalMinutes || null;
}

export function ensureNoDuplicates(arr: (string | null)[] | null): string[] {
  if (!arr) return [];
  const slugMap = new Map<string, string>();

  arr.forEach((str) => {
    if (str) {
      const slug = slugify(str);
      if (!slugMap.has(slug)) {
        slugMap.set(slug, str);
      }
    }
  });

  return Array.from(slugMap.values());
}

export function encodeStringToId(str: string) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function proxyUrl(url: string | null) {
  if (!url) return null;
  return `${baseURL}:${port}/proxy/pahe?url=${encodeURIComponent(url)}`;
}

/**
 * Fetches an image from a URL and returns a base64-encoded data URI string.
 * @param url The image URL
 * @returns Promise<string> The base64 data URI string
 */
export async function imageUrlToBase64(key: string, url: string): Promise<string | null> {
  return (
    (
      await Prisma.cache(`image:${key}`, Source.COMPOSER, async () => {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const contentType = response.headers["content-type"] || "image/jpeg";
        const base64 = Buffer.from(response.data, "binary").toString("base64");
        return `data:${contentType};base64,${base64}`;
      })
    )?.data ?? null
  );
}

export function isNumber(str: string | undefined) {
  if (str === undefined || str === null) return false;
  return /^[0-9]+$/.test(str);
}
