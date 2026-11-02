import { useCallback, useEffect, useState } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { useTheme } from "@/hooks/useTheme";
import { pickBackupFile, type Meta, type OpenedBackup } from "@/lib/storage";
import type { Manga } from "@/types";
import { plural } from "@/lib/format";
import { StartScreen } from "@/components/StartScreen";
import { Library } from "@/components/Library";
import { MangaDetail } from "@/components/MangaDetail";
import { Toast, type ToastMessage } from "@/components/ui/Toast";

export default function App() {
  const library = useLibrary();
  const { setting: theme, setSetting: setTheme } = useTheme();
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((text: string, tone: ToastMessage["tone"] = "neutral") => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  /* Le bouton « retour » du navigateur ramène à la bibliothèque. */
  useEffect(() => {
    const onPop = () => setOpenId(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openManga(id: string) {
    if (!openId) history.pushState({ manga: id }, "");
    setOpenId(id);
  }

  function backToLibrary() {
    if (history.state?.manga) history.back();
    else setOpenId(null);
  }

  async function handleOpened(opened: OpenedBackup) {
    await library.openBackup(opened);
    notify(`${opened.name} : ${plural(opened.mangas.length, "série", "séries")}`);
  }

  function handleResume(cached: Manga[], meta: Meta) {
    library.openCached(cached, meta);
  }

  async function save() {
    try {
      const r = await library.save();
      if (!r) return;
      notify(r.mode === "file" ? `Enregistré dans ${r.name}` : `Sauvegarde téléchargée : ${r.name}`);
    } catch {
      notify("L'enregistrement a échoué.", "error");
    }
  }

  async function exportCopy() {
    try {
      const r = await library.exportCopy();
      if (r) notify(`Copie exportée : ${r.name}`);
    } catch {
      notify("L'export a échoué.", "error");
    }
  }

  async function openOther() {
    if (library.dirty && !confirm("Des modifications ne sont pas enregistrées. Ouvrir un autre fichier quand même ?")) return;
    try {
      const opened = await pickBackupFile();
      if (opened) await handleOpened(opened);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Impossible de lire ce fichier.", "error");
    }
  }

  function closeLibrary() {
    if (library.dirty && !confirm("Des modifications ne sont pas enregistrées. Fermer quand même ?")) return;
    setOpenId(null);
    library.close();
  }

  const active = openId ? library.mangas?.find((m) => m.id === openId) : undefined;

  return (
    <>
      {library.mangas === null ? (
        <StartScreen
          onOpened={handleOpened}
          onResume={handleResume}
          onFresh={library.startFresh}
          onError={(m) => notify(m, "error")}
        />
      ) : active ? (
        <MangaDetail
          manga={active}
          onBack={backToLibrary}
          onUpdate={(patch) => library.updateManga(active.id, patch)}
          onDelete={() => library.deleteManga(active.id)}
          onUpsertChapter={(c, replaceNum) => library.upsertChapter(active.id, c, replaceNum)}
          onDeleteChapter={(num) => library.deleteChapter(active.id, num)}
        />
      ) : (
        <Library
          library={library}
          onOpenManga={openManga}
          onSave={save}
          onExport={exportCopy}
          onOpenOther={openOther}
          onCloseLibrary={closeLibrary}
          theme={theme}
          onTheme={setTheme}
        />
      )}
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
