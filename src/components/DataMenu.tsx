import type { ReactNode } from "react";
import { Download, FolderOpen, LogOut, Save } from "lucide-react";
import type { Library } from "@/hooks/useLibrary";
import type { ThemeSetting } from "@/types";
import { canUseFileSystem } from "@/lib/storage";
import { fmtDateTime, plural } from "@/lib/format";
import { Sheet } from "./ui/Sheet";

interface Props {
  open: boolean;
  onClose: () => void;
  library: Library;
  onSave: () => void;
  onExport: () => void;
  onOpenOther: () => void;
  onCloseLibrary: () => void;
  theme: ThemeSetting;
  onTheme: (t: ThemeSetting) => void;
}

const THEMES: { key: ThemeSetting; label: string }[] = [
  { key: "system", label: "Système" },
  { key: "light", label: "Clair" },
  { key: "dark", label: "Sombre" },
];

export function DataMenu({ open, onClose, library, onSave, onExport, onOpenOther, onCloseLibrary, theme, onTheme }: Props) {
  const { source, dirty, savedAt, mangas } = library;
  const count = mangas?.length ?? 0;

  const status = source.handle
    ? `Fichier : ${source.fileName}`
    : source.fileName
      ? `Dernier fichier : ${source.fileName}`
      : "Aucun fichier associé pour l'instant";

  return (
    <Sheet open={open} onClose={onClose} title="Vos données">
      <p className="text-sm text-ink-muted">
        {plural(count, "série", "séries")}. {status}.
        {savedAt && <> Enregistré {fmtDateTime(savedAt).replace(/^(\d)/, "le $1")}.</>}
      </p>
      {dirty && <p className="mt-1 text-sm font-semibold text-seal">Des modifications ne sont pas encore dans votre fichier.</p>}

      <ul className="mt-4 divide-y">
        <MenuItem
          icon={<Save size={18} />}
          title={source.handle ? "Enregistrer" : canUseFileSystem ? "Enregistrer dans un fichier" : "Télécharger la sauvegarde"}
          desc={
            source.handle
              ? "Écrit directement dans le fichier ouvert."
              : canUseFileSystem
                ? "Choisissez où garder votre fichier ; les prochains enregistrements iront au même endroit."
                : "Votre navigateur ne sait pas écrire dans un fichier : la sauvegarde est téléchargée."
          }
          onClick={() => {
            onClose();
            onSave();
          }}
          accent={dirty}
        />
        {source.handle && (
          <MenuItem
            icon={<Download size={18} />}
            title="Exporter une copie"
            desc="Télécharge un second fichier, sans toucher à l'original."
            onClick={() => {
              onClose();
              onExport();
            }}
          />
        )}
        <MenuItem
          icon={<FolderOpen size={18} />}
          title="Ouvrir une autre sauvegarde"
          desc="Remplace la bibliothèque affichée."
          onClick={() => {
            onClose();
            onOpenOther();
          }}
        />
        <MenuItem
          icon={<LogOut size={18} />}
          title="Fermer la bibliothèque"
          desc="Retour à l'écran d'accueil."
          onClick={() => {
            onClose();
            onCloseLibrary();
          }}
        />
      </ul>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Apparence</span>
        <div className="flex rounded-full bg-tone p-0.5" role="radiogroup" aria-label="Apparence">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={theme === t.key}
              onClick={() => onTheme(t.key)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                theme === t.key ? "bg-sheet text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-muted">
        Rien ne quitte votre appareil. Le navigateur garde une copie de travail, mais le fichier reste la vraie
        sauvegarde : c'est lui que vous pouvez déplacer, dupliquer ou rouvrir ailleurs.
      </p>
    </Sheet>
  );
}

function MenuItem({
  icon,
  title,
  desc,
  onClick,
  accent = false,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-3 text-left hover:bg-tone/60"
      >
        <span className={`mt-0.5 shrink-0 ${accent ? "text-seal" : "text-ink-muted"}`}>{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block text-xs text-ink-muted">{desc}</span>
        </span>
      </button>
    </li>
  );
}
