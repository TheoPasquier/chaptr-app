import type { Chapter, Manga, MangaStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

/* ───────────────────────────── Format de sauvegarde ───────────────────────────── */

export interface Backup {
  app: "chaptr";
  version: 2;
  exportedAt: string;
  mangas: Manga[];
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function normalizeChapter(raw: unknown): Chapter | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const n = num(r.num, NaN);
  if (!Number.isFinite(n)) return null;
  return { num: n, name: str(r.name), date: num(r.date, Date.now()), memo: str(r.memo) };
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Accepte une entrée brute (v1 ou v2) et renvoie une série propre, ou null. */
export function normalizeManga(raw: unknown): Manga | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title).trim();
  if (!title) return null;
  const chapters = Array.isArray(r.chapters)
    ? (r.chapters.map(normalizeChapter).filter(Boolean) as Chapter[])
    : [];
  const total = num(r.totalChapters, NaN);
  const status = typeof r.status === "string" && r.status in STATUS_LABELS ? (r.status as MangaStatus) : undefined;
  const anilistId = num(r.anilistId, NaN);
  const manga: Manga = {
    id: r.id !== undefined && r.id !== null && r.id !== "" ? String(r.id) : newId(),
    addedAt: num(r.addedAt, Date.now()),
    title,
    aliases: Array.isArray(r.aliases) ? r.aliases.map((a) => str(a).trim()).filter(Boolean) : [],
    cover: str(r.cover),
    banner: str(r.banner),
    description: str(r.description),
    chapters,
  };
  if (Number.isFinite(total) && total > 0) manga.totalChapters = total;
  if (status) manga.status = status;
  if (Number.isFinite(anilistId) && anilistId > 0) manga.anilistId = anilistId;
  return manga;
}

/**
 * Lit un fichier de sauvegarde. Compatible avec les exports de la première
 * version (simple tableau) et le format actuel (objet enveloppé).
 */
export function parseBackup(text: string): Manga[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde Chaptr lisible.");
  }
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Backup).mangas)
      ? (data as Backup).mangas
      : null;
  if (!list) throw new Error("Ce fichier ne contient pas de bibliothèque.");
  return list.map(normalizeManga).filter(Boolean) as Manga[];
}

export function serializeBackup(mangas: Manga[]): string {
  const backup: Backup = { app: "chaptr", version: 2, exportedAt: new Date().toISOString(), mangas };
  return JSON.stringify(backup, null, 2);
}

export function defaultFileName(): string {
  return `chaptr-${new Date().toISOString().slice(0, 10)}.json`;
}

/* ───────────────────────────── IndexedDB (cache local) ───────────────────────────── */

const DB_NAME = "chaptr";
const STORE = "kv";
const KEY_MANGAS = "mangas";
const KEY_HANDLE = "fileHandle";
const KEY_META = "meta";
const LEGACY_LS_KEY = "chaptr-local-mangas";

export interface Meta {
  fileName?: string;
  savedAt?: number;
  cachedAt?: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function kvDel(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Bibliothèque gardée sur l'appareil (migre l'ancien localStorage si besoin). */
export async function readCache(): Promise<Manga[] | null> {
  try {
    const cached = await kvGet<Manga[]>(KEY_MANGAS);
    if (cached) return cached;
    const legacy = localStorage.getItem(LEGACY_LS_KEY);
    if (legacy) {
      const list = parseBackup(legacy);
      await kvSet(KEY_MANGAS, list);
      localStorage.removeItem(LEGACY_LS_KEY);
      return list;
    }
  } catch {
    /* IndexedDB indisponible (navigation privée stricte…) : on continue sans cache. */
  }
  return null;
}

export async function writeCache(mangas: Manga[]): Promise<void> {
  await kvSet(KEY_MANGAS, mangas);
}

export async function clearCache(): Promise<void> {
  await Promise.all([kvDel(KEY_MANGAS), kvDel(KEY_HANDLE), kvDel(KEY_META)]);
}

export async function readMeta(): Promise<Meta> {
  try {
    return (await kvGet<Meta>(KEY_META)) ?? {};
  } catch {
    return {};
  }
}

export async function writeMeta(patch: Meta): Promise<void> {
  const current = await readMeta();
  await kvSet(KEY_META, { ...current, ...patch });
}

/* ───────────────────────────── Fichiers ───────────────────────────── */

export const canUseFileSystem =
  typeof window !== "undefined" && "showOpenFilePicker" in window && "showSaveFilePicker" in window;

const FILE_TYPES: FilePickerAcceptType[] = [
  { description: "Sauvegarde Chaptr", accept: { "application/json": [".json"], "text/plain": [".txt"] } },
];

export interface OpenedBackup {
  mangas: Manga[];
  handle?: FileSystemFileHandle;
  name: string;
}

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

async function readHandle(handle: FileSystemFileHandle): Promise<OpenedBackup> {
  const file = await handle.getFile();
  return { mangas: parseBackup(await file.text()), handle, name: file.name };
}

/** Ouvre une sauvegarde via la boîte de dialogue du système. `null` si annulé. */
export async function pickBackupFile(): Promise<OpenedBackup | null> {
  if (canUseFileSystem) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, multiple: false });
      return await readHandle(handle);
    } catch (e) {
      if (isAbort(e)) return null;
      throw e;
    }
  }
  // Repli : <input type="file"> classique (Firefox, Safari…).
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.txt,application/json,text/plain";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve({ mangas: parseBackup(await file.text()), name: file.name });
      } catch (e) {
        reject(e);
      }
    };
    // Si l'utilisateur annule, aucun événement fiable : on laisse la promesse en suspens
    // mais on la libère au retour du focus sur la fenêtre.
    window.addEventListener("focus", () => setTimeout(() => resolve(null), 1500), { once: true });
    input.click();
  });
}

export async function readDroppedFile(file: File): Promise<OpenedBackup> {
  return { mangas: parseBackup(await file.text()), name: file.name };
}

/** Le dernier fichier ouvert, si le navigateur sait le mémoriser. */
export async function rememberedHandle(): Promise<FileSystemFileHandle | undefined> {
  if (!canUseFileSystem) return undefined;
  try {
    return await kvGet<FileSystemFileHandle>(KEY_HANDLE);
  } catch {
    return undefined;
  }
}

export async function rememberHandle(handle: FileSystemFileHandle | undefined): Promise<void> {
  try {
    if (handle) await kvSet(KEY_HANDLE, handle);
    else await kvDel(KEY_HANDLE);
  } catch {
    /* pas grave */
  }
}

async function ensureWritable(handle: FileSystemFileHandle): Promise<boolean> {
  const opts = { mode: "readwrite" as const };
  if ((await handle.queryPermission(opts)) === "granted") return true;
  return (await handle.requestPermission(opts)) === "granted";
}

/** Rouvre un fichier mémorisé (demande l'autorisation si nécessaire). */
export async function reopenHandle(handle: FileSystemFileHandle): Promise<OpenedBackup | null> {
  try {
    if (!(await ensureWritable(handle))) return null;
    return await readHandle(handle);
  } catch (e) {
    if (e instanceof DOMException && (e.name === "NotFoundError" || e.name === "NotAllowedError")) return null;
    throw e;
  }
}

export interface SaveResult {
  handle?: FileSystemFileHandle;
  name: string;
  /** `download` quand le navigateur ne sait pas écrire dans un fichier. */
  mode: "file" | "download";
}

/**
 * Enregistre la bibliothèque. Avec un handle on écrit directement dans le
 * fichier ; sinon on ouvre « Enregistrer sous » (Chromium) ou un téléchargement.
 * `null` si l'utilisateur annule.
 */
export async function saveBackup(mangas: Manga[], handle?: FileSystemFileHandle): Promise<SaveResult | null> {
  const text = serializeBackup(mangas);

  if (handle) {
    if (!(await ensureWritable(handle))) return null;
    const w = await handle.createWritable();
    await w.write(text);
    await w.close();
    return { handle, name: handle.name, mode: "file" };
  }

  if (canUseFileSystem) {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: defaultFileName(), types: FILE_TYPES });
      const w = await h.createWritable();
      await w.write(text);
      await w.close();
      return { handle: h, name: h.name, mode: "file" };
    } catch (e) {
      if (isAbort(e)) return null;
      throw e;
    }
  }

  downloadText(text, defaultFileName());
  return { name: defaultFileName(), mode: "download" };
}

export function downloadText(text: string, name: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
