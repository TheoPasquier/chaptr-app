import { useRef, useState, type PointerEvent } from "react";

export const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

interface Props {
  active: string;
  used: Set<string>;
  onSelect: (letter: string) => void;
}

/**
 * Rail alphabétique : on tape ou on fait glisser le doigt pour filtrer.
 * « # » affiche tout. Les lettres sans titre sont grisées mais restent
 * atteignables pour garder le geste fluide.
 */
export function LetterRail({ active, used, onSelect }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState<number>(-1);

  function indexFromY(clientY: number): number {
    const el = railRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const i = Math.floor(((clientY - rect.top) / rect.height) * LETTERS.length);
    return Math.max(0, Math.min(LETTERS.length - 1, i));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const i = indexFromY(e.clientY);
    setScrubbing(i);
    onSelect(LETTERS[i]);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (scrubbing < 0) return;
    const i = indexFromY(e.clientY);
    if (i !== scrubbing) {
      setScrubbing(i);
      onSelect(LETTERS[i]);
    }
  }

  function onPointerUp() {
    setScrubbing(-1);
  }

  return (
    <div className="relative flex shrink-0 items-center" aria-label="Filtrer par première lettre">
      <div
        ref={railRef}
        role="listbox"
        aria-activedescendant={`rail-${active}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          const i = LETTERS.indexOf(active);
          if (e.key === "ArrowDown") onSelect(LETTERS[Math.min(LETTERS.length - 1, i + 1)]);
          if (e.key === "ArrowUp") onSelect(LETTERS[Math.max(0, i - 1)]);
          if (e.key === "Home") onSelect("#");
        }}
        className="flex max-h-[70dvh] cursor-pointer touch-none select-none flex-col items-center py-2"
        style={{ width: 28 }}
      >
        {LETTERS.map((l) => {
          const isActive = l === active;
          const has = l === "#" || used.has(l);
          return (
            <span
              key={l}
              id={`rail-${l}`}
              role="option"
              aria-selected={isActive}
              className={`grid h-[1.15rem] w-5 place-items-center rounded-[4px] text-[11px] leading-none transition-colors ${
                isActive
                  ? "bg-ink font-bold text-paper"
                  : has
                    ? "font-semibold text-ink"
                    : "text-ink-muted/45"
              }`}
            >
              {l}
            </span>
          );
        })}
      </div>
      {scrubbing >= 0 && (
        <div
          className="rail-bubble"
          style={{ top: `calc(${((scrubbing + 0.5) / LETTERS.length) * 100}% - 1.625rem)` }}
          aria-hidden
        >
          {LETTERS[scrubbing]}
        </div>
      )}
    </div>
  );
}
