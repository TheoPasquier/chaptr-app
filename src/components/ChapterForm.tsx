import { useEffect, useState } from "react";
import type { Chapter, Manga } from "@/types";
import { fmtDate, nextChapterNum } from "@/lib/format";
import { Sheet } from "./ui/Sheet";
import { Button } from "./ui/Button";
import { Input, Labelled, Textarea } from "./ui/Field";

interface Props {
  open: boolean;
  onClose: () => void;
  manga: Manga;
  /** Chapitre à modifier ; absent pour un ajout. */
  initial?: Chapter;
  onSave: (chapter: Chapter, replaceNum?: number) => void;
  onDelete?: (num: number) => void;
}

export function ChapterForm({ open, onClose, manga, initial, onSave, onDelete }: Props) {
  const editing = !!initial;
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNum(initial ? String(initial.num) : String(nextChapterNum(manga)));
    setName(initial?.name ?? "");
    setMemo(initial?.memo ?? "");
    setConfirmDelete(false);
  }, [open, initial, manga]);

  const parsed = parseFloat(num.replace(",", "."));
  const valid = Number.isFinite(parsed) && parsed >= 0;
  const clash = valid && manga.chapters.some((c) => c.num === parsed && c.num !== initial?.num);

  function submit() {
    if (!valid || clash) return;
    onSave(
      { num: parsed, name: name.trim(), memo: memo.trim(), date: initial?.date ?? Date.now() },
      initial?.num,
    );
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Modifier le chapitre" : "Chapitre lu"}
      footer={
        confirmDelete ? (
          <>
            <p className="mr-auto text-sm text-ink-muted">Retirer ce chapitre ?</p>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Non
            </Button>
            <Button
              variant="ink"
              size="sm"
              className="!bg-seal !text-seal-ink"
              onClick={() => {
                if (initial) onDelete?.(initial.num);
                onClose();
              }}
            >
              Retirer
            </Button>
          </>
        ) : (
          <>
            {editing && onDelete && (
              <Button variant="danger" size="sm" className="mr-auto" onClick={() => setConfirmDelete(true)}>
                Retirer
              </Button>
            )}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="ink" size="sm" onClick={submit} disabled={!valid || clash}>
              {editing ? "Enregistrer" : "Marquer comme lu"}
            </Button>
          </>
        )
      }
    >
      <form
        className="space-y-4 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <Labelled label="Chapitre">
            {(id) => (
              <Input
                id={id}
                autoFocus
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="numeral text-2xl"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            )}
          </Labelled>
          <Labelled label="Son titre" hint="facultatif">
            {(id) => <Input id={id} placeholder="Ex. : Le retour" value={name} onChange={(e) => setName(e.target.value)} />}
          </Labelled>
        </div>
        {clash && <p className="-mt-2 text-xs text-seal">Ce chapitre est déjà dans la liste.</p>}

        <Labelled label="Ce qu'il s'est passé" hint="facultatif">
          {(id) => (
            <Textarea
              id={id}
              placeholder="Un mot pour s'y retrouver à la reprise…"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          )}
        </Labelled>

        {initial && <p className="text-xs text-ink-muted">Lu le {fmtDate(initial.date)}.</p>}
        <button type="submit" className="sr-only">
          Valider
        </button>
      </form>
    </Sheet>
  );
}
