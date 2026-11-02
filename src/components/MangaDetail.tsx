import { useEffect, useState } from "react";
import { ChevronLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import type { Chapter, Manga, MangaInput } from "@/types";
import { STATUS_LABELS } from "@/types";
import { fmtDate, fmtNum, initialOf, plural, sortedChapters, timeAgo } from "@/lib/format";
import { Button } from "./ui/Button";
import { Seal } from "./ui/Seal";
import { MangaForm } from "./MangaForm";
import { ChapterForm } from "./ChapterForm";

interface Props {
  manga: Manga;
  onBack: () => void;
  onUpdate: (patch: Partial<MangaInput>) => void;
  onDelete: () => void;
  onUpsertChapter: (chapter: Chapter, replaceNum?: number) => void;
  onDeleteChapter: (num: number) => void;
}

export function MangaDetail({ manga, onBack, onUpdate, onDelete, onUpsertChapter, onDeleteChapter }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [chapterSheet, setChapterSheet] = useState<{ open: boolean; initial?: Chapter }>({ open: false });
  const [expanded, setExpanded] = useState(false);
  const [justStamped, setJustStamped] = useState<number | null>(null);

  const chapters = sortedChapters(manga);
  const last = chapters[0];
  const longDesc = manga.description.length > 220;
  const total = manga.totalChapters;
  const progress = last && total ? Math.min(1, last.num / total) : null;
  const statusLine = [manga.status ? STATUS_LABELS[manga.status] : null, total ? `${fmtNum(total)} chapitres` : null]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [manga.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  function saveChapter(c: Chapter, replaceNum?: number) {
    onUpsertChapter(c, replaceNum);
    if (replaceNum === undefined) {
      setJustStamped(c.num);
      window.setTimeout(() => setJustStamped(null), 600);
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl pb-24">
      {/* ── Bannière ── */}
      <div className="relative h-44 overflow-hidden bg-ink sm:h-56">
        {manga.banner ? (
          <img src={manga.banner} alt="" className="h-full w-full object-cover" />
        ) : manga.cover ? (
          <img
            src={manga.cover}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-70 blur-md"
            aria-hidden
          />
        ) : (
          <div className="halftone h-full w-full opacity-60" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/20 to-transparent" />

        <nav className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-ink/70 pl-2 pr-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-ink/85"
          >
            <ChevronLeft size={18} /> Bibliothèque
          </button>
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink/70 px-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-ink/85"
          >
            <Pencil size={14} /> Modifier
          </button>
        </nav>
      </div>

      <div className="px-4 sm:px-6 lg:grid lg:grid-cols-[22rem_1fr] lg:gap-12">
        {/* ── Fiche ── */}
        <section className="relative -mt-20 sm:-mt-24 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-end gap-4">
            <div className="cover w-28 shrink-0 shadow-card ring-1 ring-black/10 sm:w-32 lg:w-36">
              {manga.cover ? (
                <img src={manga.cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="halftone grid h-full w-full place-items-center">
                  <span className="numeral text-4xl text-ink-muted/70">{initialOf(manga.title)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{manga.title}</h1>
              {manga.aliases.length > 0 && (
                <p className="mt-1 text-sm text-ink-muted">{manga.aliases.join(", ")}</p>
              )}
              {(statusLine || manga.anilistId) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                  {statusLine && <span>{statusLine}</span>}
                  {manga.anilistId && (
                    <a
                      href={`https://anilist.co/manga/${manga.anilistId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 hover:text-ink"
                    >
                      AniList <ExternalLink size={11} />
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Marque-page */}
          <div className="mt-5 rounded-lg bg-sheet p-3 shadow-card">
            <div className="flex items-center gap-3">
              {last ? (
                <>
                  <Seal num={last.num} size="lg" animate={justStamped === last.num} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                      {last.name ? last.name : `Chapitre ${fmtNum(last.num)}`}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Lu {timeAgo(last.date)},{" "}
                      {total
                        ? `${fmtNum(last.num)} sur ${fmtNum(total)}`
                        : plural(chapters.length, "chapitre noté", "chapitres notés")}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Aucun chapitre noté pour l'instant.</p>
              )}
              <Button
                variant="ink"
                size="sm"
                className="ml-auto shrink-0"
                onClick={() => setChapterSheet({ open: true })}
                aria-label="Noter un chapitre lu"
              >
                <Plus size={15} /> <span className="hidden sm:inline">Chapitre</span>
              </Button>
            </div>
            {progress !== null && (
              <div
                className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-tone"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-label="Avancement"
              >
                <div className="h-full bg-ink" style={{ width: `${progress * 100}%` }} />
              </div>
            )}
          </div>

          {manga.description && (
            <div className="mt-5">
              <p className={`text-sm leading-relaxed text-ink-muted ${expanded || !longDesc ? "" : "line-clamp-4"}`}>
                {manga.description}
              </p>
              {longDesc && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-sm font-semibold hover:underline"
                >
                  {expanded ? "Réduire" : "Lire la suite"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Journal des chapitres ── */}
        <section className="mt-8 lg:mt-6">
          <div className="flex items-baseline justify-between border-b pb-2">
            <h2 className="text-lg font-bold">Chapitres lus</h2>
            <span className="text-sm text-ink-muted">{chapters.length}</span>
          </div>

          {chapters.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-sm text-ink-muted">
                Notez le dernier chapitre lu pour poser votre marque-page.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setChapterSheet({ open: true })}>
                <Plus size={14} /> Noter un chapitre
              </Button>
            </div>
          ) : (
            <ol className="divide-y">
              {chapters.map((c, i) => (
                <li key={c.num}>
                  <button
                    type="button"
                    onClick={() => setChapterSheet({ open: true, initial: c })}
                    className="group -mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-md px-2 py-3.5 text-left hover:bg-sheet"
                    aria-label={`Chapitre ${fmtNum(c.num)}, modifier`}
                  >
                    <div className="w-14 shrink-0 pt-0.5">
                      {i === 0 ? (
                        <Seal num={c.num} size="md" />
                      ) : (
                        <span className="numeral block text-xl leading-none text-ink-muted">{fmtNum(c.num)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-base leading-snug ${c.name ? "font-semibold" : "text-ink-muted"}`}>
                          {c.name || `Chapitre ${fmtNum(c.num)}`}
                        </p>
                        <time dateTime={new Date(c.date).toISOString()} className="shrink-0 pt-0.5 text-xs text-ink-muted">
                          {fmtDate(c.date)}
                        </time>
                      </div>
                      {c.memo && (
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{c.memo}</p>
                      )}
                    </div>
                    <Pencil
                      size={14}
                      className="mt-1 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <MangaForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        initial={manga}
        onSave={(input) => onUpdate(input)}
        onDelete={() => {
          onDelete();
          onBack();
        }}
      />

      <ChapterForm
        open={chapterSheet.open}
        onClose={() => setChapterSheet((s) => ({ ...s, open: false }))}
        manga={manga}
        initial={chapterSheet.initial}
        onSave={saveChapter}
        onDelete={onDeleteChapter}
      />
    </div>
  );
}
