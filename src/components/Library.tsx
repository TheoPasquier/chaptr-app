import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Ellipsis, Plus, Save, Search, X } from "lucide-react";
import type { Library as LibraryState } from "@/hooks/useLibrary";
import type { MangaInput, SortKey, ThemeSetting } from "@/types";
import { SORTS } from "@/types";
import { filterAndSort, usedInitials } from "@/lib/sort";
import { plural } from "@/lib/format";
import { Button } from "./ui/Button";
import { Sheet } from "./ui/Sheet";
import { Seal } from "./ui/Seal";
import { LetterRail } from "./LetterRail";
import { MangaCard } from "./MangaCard";
import { MangaForm } from "./MangaForm";
import { DataMenu } from "./DataMenu";

interface Props {
  library: LibraryState;
  onOpenManga: (id: string) => void;
  onSave: () => void;
  onExport: () => void;
  onOpenOther: () => void;
  onCloseLibrary: () => void;
  theme: ThemeSetting;
  onTheme: (t: ThemeSetting) => void;
}

export function Library({ library, onOpenManga, onSave, onExport, onOpenOther, onCloseLibrary, theme, onTheme }: Props) {
  const mangas = library.mangas ?? [];
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("#");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showSort, setShowSort] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => filterAndSort(mangas, query, letter, sort), [mangas, query, letter, sort]);
  const used = useMemo(() => usedInitials(mangas), [mangas]);
  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "";

  /* Raccourci « / » pour chercher */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function addManga(input: MangaInput) {
    const m = library.addManga(input);
    onOpenManga(m.id);
  }

  const filtered = query.trim() !== "" || letter !== "#";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col">
      {/* ── En-tête ── */}
      <header className="sticky top-0 z-10 bg-paper/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="flex items-baseline gap-2 text-2xl font-extrabold tracking-tight">
            Chaptr
            <span className="text-sm font-medium text-ink-muted">{plural(mangas.length, "série", "séries")}</span>
          </h1>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              title={library.dirty ? "Modifications non enregistrées" : "Tout est enregistré"}
              className="relative"
            >
              <Save size={15} />
              <span className="hidden sm:inline">Enregistrer</span>
              {library.dirty && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-seal ring-2 ring-paper" aria-hidden />
              )}
            </Button>
            <Button variant="ghost" size="sm" icon aria-label="Vos données" onClick={() => setShowMenu(true)}>
              <Ellipsis size={18} />
            </Button>
            <Button variant="ink" size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> <span className="hidden sm:inline">Ajouter</span>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Rechercher un titre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              className="field h-10 rounded-full !pl-9 !pr-9"
              aria-label="Rechercher"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-tone hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowSort(true)} className="h-10 shrink-0 !px-3" title="Trier">
            <ArrowUpDown size={15} />
            <span className="hidden md:inline">{sortLabel}</span>
          </Button>
        </div>

        {letter !== "#" && (
          <div className="mt-2.5 flex items-center gap-2 text-sm">
            <span className="text-ink-muted">Titres en</span>
            <button
              type="button"
              onClick={() => setLetter("#")}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 font-semibold text-paper"
            >
              {letter} <X size={12} />
            </button>
          </div>
        )}
      </header>

      {/* ── Corps ── */}
      <div className="flex flex-1">
        <main className="min-w-0 flex-1 px-4 pb-24 pt-1 sm:px-6">
          {mangas.length === 0 ? (
            <EmptyLibrary onAdd={() => setShowAdd(true)} />
          ) : visible.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-semibold">Aucun titre ne correspond.</p>
              <p className="mt-1 text-sm text-ink-muted">
                {filtered ? "Essayez un autre mot, ou retirez le filtre de lettre." : ""}
              </p>
              {filtered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setQuery("");
                    setLetter("#");
                  }}
                >
                  Tout afficher
                </Button>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] sm:gap-x-4">
              {visible.map((m) => (
                <li key={m.id}>
                  <MangaCard manga={m} onOpen={() => onOpenManga(m.id)} />
                </li>
              ))}
            </ul>
          )}
        </main>

        {mangas.length > 0 && (
          <aside className="sticky top-32 self-start pr-0.5 pt-1 sm:pr-2">
            <LetterRail active={letter} used={used} onSelect={setLetter} />
          </aside>
        )}
      </div>

      {library.cacheError && (
        <p className="fixed inset-x-0 bottom-0 z-20 bg-seal px-4 py-2 text-center text-sm font-medium text-seal-ink">
          {library.cacheError}
        </p>
      )}

      {/* ── Feuilles ── */}
      <Sheet open={showSort} onClose={() => setShowSort(false)} title="Trier la bibliothèque">
        <ul className="-mx-2 pb-2">
          {SORTS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => {
                  setSort(s.key);
                  setShowSort(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-base ${
                  sort === s.key ? "bg-ink font-semibold text-paper" : "hover:bg-tone/60"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <MangaForm open={showAdd} onClose={() => setShowAdd(false)} onSave={addManga} />

      <DataMenu
        open={showMenu}
        onClose={() => setShowMenu(false)}
        library={library}
        onSave={onSave}
        onExport={onExport}
        onOpenOther={onOpenOther}
        onCloseLibrary={onCloseLibrary}
        theme={theme}
        onTheme={onTheme}
      />
    </div>
  );
}

function EmptyLibrary({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <div className="mx-auto flex w-fit items-end gap-2">
        <div className="cover halftone w-20 shadow-card" aria-hidden />
        <div className="cover halftone w-20 shadow-card" aria-hidden />
        <div className="cover relative w-20 bg-ink shadow-card" aria-hidden>
          <span className="absolute -right-1 bottom-2">
            <Seal num={1} size="sm" stamped />
          </span>
        </div>
      </div>
      <h2 className="mt-8 text-xl font-bold">Votre étagère est vide</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Ajoutez une première série et notez le dernier chapitre lu. Le sceau rouge vous dira toujours où vous en
        êtes.
      </p>
      <Button variant="ink" className="mt-6" onClick={onAdd}>
        <Plus size={16} /> Ajouter une série
      </Button>
    </div>
  );
}
