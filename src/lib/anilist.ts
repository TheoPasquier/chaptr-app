import type { MangaStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

/**
 * Recherche de séries sur AniList (API GraphQL publique, sans clé).
 * Rien n'est appelé tant que l'utilisateur n'ouvre pas la recherche.
 * Limite : ~90 requêtes/minute, largement suffisant avec la saisie différée.
 */

const ENDPOINT = "https://graphql.anilist.co";

const QUERY = `query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: MANGA, sort: SEARCH_MATCH, isAdult: false) {
      id
      title { romaji english native }
      synonyms
      coverImage { large extraLarge }
      bannerImage
      description(asHtml: false)
      chapters
      status
      format
      countryOfOrigin
      startDate { year }
      siteUrl
    }
  }
}`;

export interface AniListMedia {
  id: number;
  title: { romaji: string | null; english: string | null; native: string | null };
  synonyms: string[];
  coverImage: { large: string | null; extraLarge: string | null } | null;
  bannerImage: string | null;
  description: string | null;
  chapters: number | null;
  status: MangaStatus | null;
  format: string | null;
  countryOfOrigin: string | null;
  startDate: { year: number | null } | null;
  siteUrl: string;
}

export class AniListError extends Error {}

export async function searchManga(search: string, signal?: AbortSignal): Promise<AniListMedia[]> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { search } }),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AniListError(navigator.onLine ? "AniList est injoignable pour le moment." : "Vous êtes hors connexion.");
  }
  if (res.status === 429) throw new AniListError("Trop de recherches d'un coup : patientez une minute.");
  if (!res.ok) throw new AniListError(`AniList a répondu avec une erreur (${res.status}).`);
  const json = (await res.json()) as { data?: { Page?: { media?: AniListMedia[] } }; errors?: { message: string }[] };
  if (json.errors?.length) throw new AniListError(json.errors[0].message);
  return json.data?.Page?.media ?? [];
}

/** Titre à afficher : anglais, sinon romaji, sinon natif. */
export function displayTitle(m: AniListMedia): string {
  return (m.title.english || m.title.romaji || m.title.native || "").trim();
}

/** Les autres graphies, sans doublon ni le titre retenu (6 au plus). */
export function otherTitles(m: AniListMedia): string[] {
  const main = displayTitle(m).toLowerCase();
  const seen = new Set<string>([main]);
  const out: string[] = [];
  for (const t of [m.title.romaji, m.title.english, m.title.native, ...(m.synonyms ?? [])]) {
    const v = (t ?? "").trim();
    const key = v.toLowerCase();
    if (!v || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= 6) break;
  }
  return out;
}

const KIND: Record<string, string> = { JP: "Manga", KR: "Manhwa", CN: "Manhua", TW: "Manhua" };

/** « Manhwa, 2018 », « One-shot, 2021 »… */
export function kindLabel(m: AniListMedia): string {
  let kind = KIND[m.countryOfOrigin ?? ""] ?? "Manga";
  if (m.format === "ONE_SHOT") kind = "One-shot";
  else if (m.format === "NOVEL") kind = "Roman";
  const year = m.startDate?.year;
  return year ? `${kind}, ${year}` : kind;
}

export function statusLabel(status: MangaStatus | null): string | undefined {
  return status ? STATUS_LABELS[status] : undefined;
}

/** Nettoie le synopsis AniList (balises HTML légères, entités, spoilers). */
export function cleanDescription(raw: string | null): string {
  if (!raw) return "";
  const text = raw
    .replace(/~!([\s\S]*?)!~/g, "") // spoilers masqués sur AniList
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(i|b|em|strong|p|u|a)[^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n");
  const doc = new DOMParser().parseFromString(text, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export interface Prefill {
  title: string;
  aliases: string[];
  cover: string;
  banner: string;
  description: string;
  totalChapters?: number;
  status?: MangaStatus;
  anilistId: number;
}

export function toPrefill(m: AniListMedia): Prefill {
  return {
    title: displayTitle(m),
    aliases: otherTitles(m),
    cover: m.coverImage?.extraLarge || m.coverImage?.large || "",
    banner: m.bannerImage || "",
    description: cleanDescription(m.description),
    totalChapters: m.chapters && m.chapters > 0 ? m.chapters : undefined,
    status: m.status ?? undefined,
    anilistId: m.id,
  };
}
