import { useId, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { ImagePlus, Globe, Loader2, X } from "lucide-react";
import { BANNER_MAX, COVER_MAX, isHttpUrl, localizeUrl, shrinkImage } from "@/lib/images";

interface Props {
  value: string;
  onChange: (src: string) => void;
  kind: "cover" | "banner";
}

export function CoverPicker({ value, onChange, kind }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const max = kind === "cover" ? COVER_MAX : BANNER_MAX;

  async function fromBlob(blob: Blob) {
    if (!blob.type.startsWith("image/")) {
      setError("Ce fichier n'est pas une image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onChange(await shrinkImage(blob, max));
    } catch {
      setError("Image illisible.");
    } finally {
      setBusy(false);
    }
  }

  async function fromUrl(url: string) {
    const clean = url.trim();
    if (!isHttpUrl(clean)) return;
    setBusy(true);
    setError(null);
    const { src, local } = await localizeUrl(clean, max);
    onChange(src);
    if (!local) setError("Image en ligne : elle nécessitera une connexion. Préférez un fichier.");
    setBusy(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) return void fromBlob(file);
    const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
    if (url) void fromUrl(url);
  }

  function onPaste(e: ClipboardEvent) {
    const file = e.clipboardData.files[0];
    if (file) {
      e.preventDefault();
      return void fromBlob(file);
    }
    const text = e.clipboardData.getData("text/plain");
    if (isHttpUrl(text)) {
      e.preventDefault();
      void fromUrl(text);
    }
  }

  const isCover = kind === "cover";
  const shape = isCover ? "cover w-24" : "aspect-[3/1] w-full rounded-sm overflow-hidden";
  const online = value && isHttpUrl(value);

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className={isCover ? "flex items-start gap-3" : "flex flex-col gap-2"}>
          <div className={`relative shrink-0 bg-tone ${shape}`}>
            <img src={value} alt="" className="h-full w-full object-cover" />
            {online && (
              <span
                title="Image en ligne"
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/80 text-paper"
              >
                <Globe size={11} />
              </span>
            )}
          </div>
          <div className={isCover ? "flex flex-col gap-1 pt-0.5" : "flex items-center gap-1"}>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-outline btn-sm">
              <ImagePlus size={14} /> Changer
            </button>
            <button type="button" onClick={() => onChange("")} className="btn btn-ghost btn-sm text-ink-muted">
              <X size={14} /> Retirer
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-4 text-center transition-colors ${
            kind === "cover" ? "h-24" : "h-20"
          } ${dragging ? "border-ink bg-tone" : "border-tone-strong hover:border-ink-muted hover:bg-sheet"}`}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin text-ink-muted" />
          ) : (
            <>
              <ImagePlus size={18} className="shrink-0 text-ink-muted" />
              <span className="text-sm text-ink-muted">
                Déposer une image, la coller, ou <span className="font-semibold text-ink">parcourir</span>
              </span>
            </>
          )}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void fromBlob(f);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-seal">{error}</p>}
    </div>
  );
}
