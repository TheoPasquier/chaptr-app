import type { Manga } from "@/types";
import { initialOf, lastChapter, timeAgo } from "@/lib/format";
import { Seal } from "./ui/Seal";

interface Props {
  manga: Manga;
  onOpen: () => void;
}

export function MangaCard({ manga, onOpen }: Props) {
  const last = lastChapter(manga);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col text-left outline-none focus-visible:[&>div:first-child]:ring-2 focus-visible:[&>div:first-child]:ring-ink focus-visible:[&>div:first-child]:ring-offset-2 focus-visible:[&>div:first-child]:ring-offset-paper"
      aria-label={`${manga.title}${last ? `, dernier chapitre lu : ${last.num}` : ""}`}
    >
      <div className="cover relative w-full shadow-card transition-transform duration-150 group-active:scale-[0.97]">
        {manga.cover ? (
          <img src={manga.cover} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="halftone grid h-full w-full place-items-center">
            <span className="numeral text-4xl text-ink-muted/70" aria-hidden>
              {initialOf(manga.title)}
            </span>
          </div>
        )}

        {last?.memo && (
          <div className="memo-peek" aria-hidden>
            <p className="line-clamp-5 text-xs leading-snug">
              {last.memo}
            </p>
          </div>
        )}

        {last && (
          <div className="absolute -right-1 bottom-2">
            <Seal num={last.num} size="sm" stamped />
          </div>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-tight">{manga.title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {last ? timeAgo(last.date) : "pas encore commencé"}
        </p>
      </div>
    </button>
  );
}
