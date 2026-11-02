import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/**
 * Feuille modale construite sur <dialog> : focus piégé, Échap, clic sur le
 * fond pour fermer, sans dépendance. Tiroir bas sur mobile, fenêtre centrée
 * à partir de 640 px.
 */
export function Sheet({ open, onClose, title, children, footer, wide = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${wide ? "sheet-wide" : ""}`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <>
          <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-2">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-2 grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-tone hover:text-ink"
            >
              <X size={18} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <footer className="flex items-center gap-2 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </>
      )}
    </dialog>
  );
}
