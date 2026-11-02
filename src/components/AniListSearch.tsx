import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import { AniListError, displayTitle, kindLabel, searchManga, statusLabel, type AniListMedia } from "@/lib/anilist";
import { fmtNum } from "@/lib/format";

interface Props {
  initialQuery: string;
  onPick: (media: AniListMedia) => void;
  onClose: () => void;
}

/**
 * Recherche AniList, affichée dans le formulaire sous le titre. La requête
 * part après une courte pause de saisie ; la précédente est annulée.
 */
export function AniListSearch({ initialQuery, onPick, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AniListMedia[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const q = query.trim();
    abortRef.current?.abort();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    const t = window.setTimeout(async () => {
      try {
        const list = await searchManga(q, controller.signal);
        if (controller.signal.aborted) return;
        setResults(list);
      } catch (e) {
        if (controller.signal.aborted) return;
        setResults(null);
        setError(e instanceof AniListError ? e.message : "La recherche a échoué.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 450);
    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="rounded-lg border bg-paper p-3" role="region" aria-label="Recherche AniList">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {loading ? (
            <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />
          ) : (
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
              }
            }}
            placeholder="Chercher une série sur AniList…"
            className="field h-9 !pl-9 text-sm"
            aria-label="Chercher sur AniList"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la recherche AniList"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-tone hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-seal">{error}</p>}

      {results && results.length === 0 && !error && (
        <p className="mt-3 text-sm text-ink-muted">Aucune série trouvée pour ce titre.</p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-2 max-h-72 divide-y overflow-y-auto">
          {results.map((m) => {
            const title = displayTitle(m);
            const sub = [m.title.native, m.title.romaji !== title ? m.title.romaji : null]
              .filter((t): t is string => !!t && t !== title)
              .join(", ");
            const meta = [kindLabel(m), m.chapters ? `${fmtNum(m.chapters)} ch.` : null, statusLabel(m.status)]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onPick(m)}
                  className="flex w-full items-start gap-3 py-2.5 text-left hover:bg-tone/60"
                >
                  <span className="cover w-10 shrink-0 bg-tone">
                    {m.coverImage?.large && (
                      <img src={m.coverImage.large} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{title}</span>
                    {sub && <span className="block truncate text-xs text-ink-muted">{sub}</span>}
                    <span className="block text-xs text-ink-muted">{meta}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-ink-muted">
        Données publiques{" "}
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 underline-offset-2 hover:text-ink hover:underline"
        >
          AniList <ExternalLink size={11} />
        </a>
        . Les images sont rapatriées en local quand c'est possible.
      </p>
    </div>
  );
}
