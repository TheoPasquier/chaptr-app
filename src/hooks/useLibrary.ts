import { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter, Manga, MangaInput } from "@/types";
import {
  newId,
  rememberHandle,
  saveBackup,
  writeCache,
  writeMeta,
  type OpenedBackup,
  type SaveResult,
} from "@/lib/storage";

export interface LibrarySource {
  /** Nom du fichier ouvert, ou undefined si la bibliothèque vit seulement dans le navigateur. */
  fileName?: string;
  handle?: FileSystemFileHandle;
}

export function useLibrary() {
  const [mangas, setMangas] = useState<Manga[] | null>(null);
  const [source, setSource] = useState<LibrarySource>({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | undefined>();
  const [cacheError, setCacheError] = useState<string | null>(null);
  const cacheTimer = useRef<number | undefined>(undefined);

  /* Cache local (IndexedDB) : écrit à chaque changement, avec un léger délai. */
  useEffect(() => {
    if (!mangas) return;
    window.clearTimeout(cacheTimer.current);
    cacheTimer.current = window.setTimeout(() => {
      writeCache(mangas)
        .then(() => {
          setCacheError(null);
          return writeMeta({ cachedAt: Date.now() });
        })
        .catch(() => setCacheError("Le navigateur n'a pas pu garder une copie locale. Enregistrez votre fichier."));
    }, 400);
    return () => window.clearTimeout(cacheTimer.current);
  }, [mangas]);

  /* Avertit avant de quitter avec des modifications non enregistrées. */
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const mutate = useCallback((fn: (prev: Manga[]) => Manga[]) => {
    setMangas((prev) => fn(prev ?? []));
    setDirty(true);
  }, []);

  /* ── Ouverture ── */

  const openBackup = useCallback(async (opened: OpenedBackup, savedTs?: number) => {
    setMangas(opened.mangas);
    setSource({ fileName: opened.name, handle: opened.handle });
    setDirty(false);
    setSavedAt(savedTs ?? Date.now());
    await rememberHandle(opened.handle);
    await writeMeta({ fileName: opened.name, savedAt: savedTs ?? Date.now() });
  }, []);

  const openCached = useCallback((cached: Manga[], meta: { fileName?: string; savedAt?: number }) => {
    setMangas(cached);
    setSource({ fileName: meta.fileName });
    setDirty(false);
    setSavedAt(meta.savedAt);
  }, []);

  const startFresh = useCallback(() => {
    setMangas([]);
    setSource({});
    setDirty(false);
    setSavedAt(undefined);
    void rememberHandle(undefined);
  }, []);

  const close = useCallback(() => {
    setMangas(null);
    setSource({});
    setDirty(false);
  }, []);

  /* ── Enregistrement ── */

  const save = useCallback(async (): Promise<SaveResult | null> => {
    if (!mangas) return null;
    const result = await saveBackup(mangas, source.handle);
    if (!result) return null;
    const ts = Date.now();
    setDirty(false);
    setSavedAt(ts);
    if (result.mode === "file") {
      setSource({ fileName: result.name, handle: result.handle });
      await rememberHandle(result.handle);
    }
    await writeMeta({ fileName: result.name, savedAt: ts });
    return result;
  }, [mangas, source.handle]);

  /** Télécharge une copie sans toucher au fichier courant. */
  const exportCopy = useCallback(async (): Promise<SaveResult | null> => {
    if (!mangas) return null;
    return saveBackup(mangas, undefined);
  }, [mangas]);

  /* ── Séries ── */

  const addManga = useCallback(
    (input: MangaInput): Manga => {
      const manga: Manga = { ...input, id: newId(), addedAt: Date.now() };
      mutate((prev) => [manga, ...prev]);
      return manga;
    },
    [mutate],
  );

  const updateManga = useCallback(
    (id: string, patch: Partial<MangaInput>) => {
      mutate((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [mutate],
  );

  const deleteManga = useCallback(
    (id: string) => {
      mutate((prev) => prev.filter((m) => m.id !== id));
    },
    [mutate],
  );

  /* ── Chapitres ── */

  const upsertChapter = useCallback(
    (mangaId: string, chapter: Chapter, replaceNum?: number) => {
      mutate((prev) =>
        prev.map((m) => {
          if (m.id !== mangaId) return m;
          const others = m.chapters.filter((c) => c.num !== chapter.num && c.num !== replaceNum);
          return { ...m, chapters: [...others, chapter] };
        }),
      );
    },
    [mutate],
  );

  const deleteChapter = useCallback(
    (mangaId: string, num: number) => {
      mutate((prev) =>
        prev.map((m) => (m.id === mangaId ? { ...m, chapters: m.chapters.filter((c) => c.num !== num) } : m)),
      );
    },
    [mutate],
  );

  return {
    mangas,
    source,
    dirty,
    savedAt,
    cacheError,
    openBackup,
    openCached,
    startFresh,
    close,
    save,
    exportCopy,
    addManga,
    updateManga,
    deleteManga,
    upsertChapter,
    deleteChapter,
  };
}

export type Library = ReturnType<typeof useLibrary>;
