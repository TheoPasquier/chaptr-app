import { useEffect, useState, type DragEvent, type ReactNode } from "react";
import { FolderOpen, HardDrive, History, Loader2, Plus } from "lucide-react";
import type { Manga } from "@/types";
import {
  canUseFileSystem,
  pickBackupFile,
  readCache,
  readDroppedFile,
  readMeta,
  rememberedHandle,
  reopenHandle,
  type Meta,
  type OpenedBackup,
} from "@/lib/storage";
import { plural, timeAgo } from "@/lib/format";
import { Seal } from "./ui/Seal";

interface Props {
  onOpened: (opened: OpenedBackup) => void;
  onResume: (cached: Manga[], meta: Meta) => void;
  onFresh: () => void;
  onError: (message: string) => void;
}

export function StartScreen({ onOpened, onResume, onFresh, onError }: Props) {
  const [ready, setReady] = useState(false);
  const [cached, setCached] = useState<Manga[] | null>(null);
  const [meta, setMeta] = useState<Meta>({});
  const [handle, setHandle] = useState<FileSystemFileHandle | undefined>();
  const [busy, setBusy] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([readCache(), readMeta(), rememberedHandle()]).then(([c, m, h]) => {
      if (!alive) return;
      setCached(c && c.length ? c : null);
      setMeta(m);
      setHandle(h);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Impossible de lire ce fichier.");
    } finally {
      setBusy(null);
    }
  }

  const reopen = () =>
    run("reopen", async () => {
      if (!handle) return;
      const opened = await reopenHandle(handle);
      if (!opened) {
        onError("Le fichier n'est plus accessible. Ouvrez-le à nouveau depuis votre ordinateur.");
        setHandle(undefined);
        return;
      }
      onOpened(opened);
    });

  const pick = () =>
    run("pick", async () => {
      const opened = await pickBackupFile();
      if (opened) onOpened(opened);
    });

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    void run("drop", async () => onOpened(await readDroppedFile(file)));
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={onDrop}
      className={`flex min-h-dvh flex-col items-center justify-center px-6 py-12 transition-colors ${
        dragging ? "bg-tone" : ""
      }`}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-end gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight">Chaptr</h1>
          <Seal num={1} size="md" stamped className="mb-2" />
        </div>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Votre journal de lecture de mangas. Tout reste sur cet appareil, dans un fichier qui vous appartient.
        </p>

        {!ready ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 size={16} className="animate-spin" /> Un instant…
          </div>
        ) : (
          <div className="mt-10 space-y-2">
            {handle && (
              <Choice
                primary
                icon={<History size={20} />}
                title={`Rouvrir ${handle.name}`}
                desc={
                  meta.savedAt
                    ? `Enregistré ${timeAgo(meta.savedAt)}. Le navigateur vous demandera peut-être l'autorisation.`
                    : "Le navigateur vous demandera peut-être l'autorisation."
                }
                busy={busy === "reopen"}
                disabled={!!busy}
                onClick={reopen}
              />
            )}

            <Choice
              primary={!handle}
              icon={<FolderOpen size={20} />}
              title="Ouvrir une sauvegarde"
              desc={
                canUseFileSystem
                  ? "Un fichier .json ou .txt exporté par Chaptr. Les enregistrements iront ensuite dans ce fichier."
                  : "Un fichier .json ou .txt exporté par Chaptr."
              }
              busy={busy === "pick" || busy === "drop"}
              disabled={!!busy}
              onClick={pick}
            />

            {cached && (
              <Choice
                icon={<HardDrive size={20} />}
                title={`Reprendre la copie de ce navigateur`}
                desc={`${plural(cached.length, "série", "séries")}${
                  meta.cachedAt ? `, modifiée ${timeAgo(meta.cachedAt)}` : ""
                }. Pratique si vous n'avez pas le fichier sous la main.`}
                disabled={!!busy}
                onClick={() => onResume(cached, meta)}
              />
            )}

            <Choice
              icon={<Plus size={20} />}
              title="Commencer une nouvelle bibliothèque"
              desc="Vous pourrez l'enregistrer dans un fichier à tout moment."
              disabled={!!busy}
              onClick={onFresh}
            />
          </div>
        )}

        <p className="mt-10 text-xs leading-relaxed text-ink-muted">
          Vous pouvez aussi déposer votre fichier de sauvegarde n'importe où sur cette page.
        </p>
      </div>
    </div>
  );
}

function Choice({
  icon,
  title,
  desc,
  onClick,
  primary = false,
  busy = false,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3.5 rounded-lg p-4 text-left transition-colors disabled:opacity-60 ${
        primary
          ? "bg-ink text-paper hover:bg-ink/90"
          : "bg-sheet shadow-card hover:bg-tone/70"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${primary ? "text-paper" : "text-ink-muted"}`}>
        {busy ? <Loader2 size={20} className="animate-spin" /> : icon}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-snug">{title}</span>
        <span className={`mt-0.5 block text-xs leading-relaxed ${primary ? "text-paper/70" : "text-ink-muted"}`}>
          {desc}
        </span>
      </span>
    </button>
  );
}
