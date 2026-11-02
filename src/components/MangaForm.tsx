import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Sparkles, X } from "lucide-react";
import type { Manga, MangaInput, MangaStatus } from "@/types";
import { STATUS_LABELS } from "@/types";
import { toPrefill, type AniListMedia } from "@/lib/anilist";
import { BANNER_MAX, COVER_MAX, localizeUrl } from "@/lib/images";
import { Sheet } from "./ui/Sheet";
import { Button } from "./ui/Button";
import { Input, Labelled, Textarea } from "./ui/Field";
import { CoverPicker } from "./CoverPicker";
import { AniListSearch } from "./AniListSearch";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (input: MangaInput) => void;
  onDelete?: () => void;
  initial?: Manga;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [MangaStatus, string][];

export function MangaForm({ open, onClose, onSave, onDelete, initial }: Props) {
  const editing = !!initial;
  const [title, setTitle] = useState("");
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasDraft, setAliasDraft] = useState("");
  const [cover, setCover] = useState("");
  const [banner, setBanner] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<MangaStatus | "">("");
  const [total, setTotal] = useState("");
  const [anilistId, setAnilistId] = useState<number | undefined>();
  const [chapNum, setChapNum] = useState("");
  const [chapName, setChapName] = useState("");
  const [chapMemo, setChapMemo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAniList, setShowAniList] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const session = useRef(0);

  useEffect(() => {
    if (!open) return;
    session.current += 1;
    setTitle(initial?.title ?? "");
    setAliases(initial?.aliases ?? []);
    setAliasDraft("");
    setCover(initial?.cover ?? "");
    setBanner(initial?.banner ?? "");
    setDescription(initial?.description ?? "");
    setStatus(initial?.status ?? "");
    setTotal(initial?.totalChapters ? String(initial.totalChapters) : "");
    setAnilistId(initial?.anilistId);
    setChapNum("");
    setChapName("");
    setChapMemo("");
    setConfirmDelete(false);
    setShowAniList(false);
    setNotice(null);
  }, [open, initial]);

  function commitAlias() {
    const a = aliasDraft.trim();
    if (a && !aliases.includes(a)) setAliases((p) => [...p, a]);
    setAliasDraft("");
  }

  function onAliasKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitAlias();
    } else if (e.key === "Backspace" && !aliasDraft && aliases.length) {
      setAliases((p) => p.slice(0, -1));
    }
  }

  /** Remplit la fiche depuis un résultat AniList. Les images déjà choisies sont conservées. */
  async function applyPrefill(media: AniListMedia) {
    const p = toPrefill(media);
    const mySession = session.current;
    setShowAniList(false);
    setNotice(null);
    setTitle(p.title);
    setAliases(p.aliases);
    if (p.description) setDescription(p.description);
    if (p.status) setStatus(p.status);
    if (p.totalChapters) setTotal(String(p.totalChapters));
    setAnilistId(p.anilistId);

    const needCover = !cover && !!p.cover;
    const needBanner = !banner && !!p.banner;
    if (needCover) setCover(p.cover);
    if (needBanner) setBanner(p.banner);
    if (!needCover && !needBanner) return;

    // Rapatrie les images en local pour que la fiche reste lisible hors connexion.
    const [c, b] = await Promise.all([
      needCover ? localizeUrl(p.cover, COVER_MAX) : null,
      needBanner ? localizeUrl(p.banner, BANNER_MAX) : null,
    ]);
    if (session.current !== mySession) return;
    if (c?.local) setCover(c.src);
    if (b?.local) setBanner(b.src);
    if ((c && !c.local) || (b && !b.local)) {
      setNotice("Image AniList gardée en ligne : elle nécessitera une connexion. Vous pouvez la remplacer par un fichier.");
    }
  }

  function submit() {
    const t = title.trim();
    if (!t) return;
    const pendingAlias = aliasDraft.trim();
    const allAliases = pendingAlias && !aliases.includes(pendingAlias) ? [...aliases, pendingAlias] : aliases;
    const n = parseFloat(chapNum.replace(",", "."));
    const chapters =
      !editing && Number.isFinite(n)
        ? [{ num: n, name: chapName.trim(), date: Date.now(), memo: chapMemo.trim() }]
        : (initial?.chapters ?? []);
    const totalNum = parseFloat(total.replace(",", "."));
    onSave({
      title: t,
      aliases: allAliases,
      cover,
      banner,
      description: description.trim(),
      chapters,
      totalChapters: Number.isFinite(totalNum) && totalNum > 0 ? totalNum : undefined,
      status: status || undefined,
      anilistId,
    });
    onClose();
  }

  const canSave = title.trim().length > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Modifier la série" : "Nouvelle série"}
      footer={
        confirmDelete ? (
          <>
            <p className="mr-auto text-sm text-ink-muted">Supprimer la série et ses chapitres ?</p>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Non
            </Button>
            <Button
              variant="ink"
              size="sm"
              className="!bg-seal !text-seal-ink"
              onClick={() => {
                onDelete?.();
                onClose();
              }}
            >
              Supprimer
            </Button>
          </>
        ) : (
          <>
            {editing && onDelete && (
              <Button variant="danger" size="sm" className="mr-auto" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
            )}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="ink" size="sm" onClick={submit} disabled={!canSave}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </>
        )
      }
    >
      <form
        className="space-y-5 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Labelled label="Titre">
          {(id) => (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id={id}
                  autoFocus={!editing}
                  placeholder="Ex. : Dandadan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Button
                  variant={showAniList ? "ink" : "outline"}
                  className="h-auto shrink-0 !rounded-md"
                  onClick={() => setShowAniList((v) => !v)}
                  aria-expanded={showAniList}
                  title="Chercher la série sur AniList pour préremplir la fiche"
                >
                  <Sparkles size={15} /> AniList
                </Button>
              </div>
              {showAniList && (
                <AniListSearch
                  initialQuery={title}
                  onPick={(m) => void applyPrefill(m)}
                  onClose={() => setShowAniList(false)}
                />
              )}
              {notice && <p className="text-xs text-seal">{notice}</p>}
            </div>
          )}
        </Labelled>

        <Labelled label="Autres titres" hint="pour la recherche">
          {(id) => (
            <div className="field flex flex-wrap items-center gap-1.5 py-1.5">
              {aliases.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-sm bg-tone px-2 py-0.5 text-sm">
                  {a}
                  <button
                    type="button"
                    aria-label={`Retirer ${a}`}
                    onClick={() => setAliases((p) => p.filter((x) => x !== a))}
                    className="text-ink-muted hover:text-ink"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                id={id}
                className="min-w-[8rem] flex-1 bg-transparent py-0.5 outline-none"
                placeholder={aliases.length ? "" : "Ex. : ダンダダン, Dan Da Dan"}
                value={aliasDraft}
                onChange={(e) => setAliasDraft(e.target.value)}
                onKeyDown={onAliasKey}
                onBlur={commitAlias}
              />
            </div>
          )}
        </Labelled>

        <div className="grid gap-5 sm:grid-cols-2">
          <Labelled label="Couverture">{() => <CoverPicker kind="cover" value={cover} onChange={setCover} />}</Labelled>
          <Labelled label="Bannière" hint="sinon la couverture, floutée">
            {() => <CoverPicker kind="banner" value={banner} onChange={setBanner} />}
          </Labelled>
        </div>

        <Labelled label="Synopsis" hint="facultatif">
          {(id) => (
            <Textarea
              id={id}
              placeholder="De quoi ça parle, les personnages, l'ambiance…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Labelled>

        <div className="grid grid-cols-2 gap-3">
          <Labelled label="Publication" hint="facultatif">
            {(id) => (
              <select
                id={id}
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value as MangaStatus | "")}
              >
                <option value="">Inconnue</option>
                {STATUS_OPTIONS.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            )}
          </Labelled>
          <Labelled label="Chapitres au total" hint="facultatif">
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="Ex. : 200"
                className="numeral text-lg"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            )}
          </Labelled>
        </div>

        {!editing && (
          <fieldset className="space-y-3 rounded-lg border border-dashed p-3.5">
            <legend className="px-1.5 text-sm font-semibold">Où en êtes-vous ?</legend>
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <Labelled label="Chapitre">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    placeholder="45"
                    className="numeral text-lg"
                    value={chapNum}
                    onChange={(e) => setChapNum(e.target.value)}
                  />
                )}
              </Labelled>
              <Labelled label="Son titre" hint="facultatif">
                {(id) => (
                  <Input id={id} placeholder="Le retour" value={chapName} onChange={(e) => setChapName(e.target.value)} />
                )}
              </Labelled>
            </div>
            <Labelled label="Ce qu'il s'est passé" hint="facultatif">
              {(id) => (
                <Textarea
                  id={id}
                  className="!min-h-[4rem]"
                  placeholder="Un mot pour s'y retrouver à la reprise…"
                  value={chapMemo}
                  onChange={(e) => setChapMemo(e.target.value)}
                />
              )}
            </Labelled>
          </fieldset>
        )}
        <button type="submit" className="sr-only">
          Valider
        </button>
      </form>
    </Sheet>
  );
}
