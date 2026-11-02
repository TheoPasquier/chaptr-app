import type { Chapter, Manga } from "@/types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** « il y a 3 h », « il y a 2 j », puis la date au-delà de deux mois. */
export function timeAgo(ts: number, now = Date.now()): string {
  const d = Math.max(0, now - ts);
  if (d < MIN) return "à l'instant";
  if (d < HOUR) return `il y a ${Math.floor(d / MIN)} min`;
  if (d < DAY) return `il y a ${Math.floor(d / HOUR)} h`;
  if (d < 7 * DAY) return `il y a ${Math.floor(d / DAY)} j`;
  if (d < 60 * DAY) return `il y a ${Math.floor(d / (7 * DAY))} sem.`;
  return `le ${fmtDate(ts)}`;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Chapitres triés du plus récent au plus ancien (par numéro). */
export function sortedChapters(m: Manga): Chapter[] {
  return [...m.chapters].sort((a, b) => b.num - a.num);
}

export function lastChapter(m: Manga): Chapter | undefined {
  return sortedChapters(m)[0];
}

/** Dernière activité : lecture la plus récente, sinon date d'ajout. */
export function lastReadAt(m: Manga): number {
  return m.chapters.length ? Math.max(...m.chapters.map((c) => c.date)) : m.addedAt;
}

export function nextChapterNum(m: Manga): number {
  const last = lastChapter(m);
  return last ? last.num + 1 : 1;
}

/** Lettre de classement d'un titre : A–Z, ou « # » pour tout le reste. */
export function initialOf(title: string): string {
  const c = title
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/** Formate un numéro de chapitre (gère les décimaux type 12.5). */
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("fr-FR");
}
