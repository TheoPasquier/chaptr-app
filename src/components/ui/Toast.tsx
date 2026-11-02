import { useEffect } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  tone?: "neutral" | "error";
}

interface Props {
  toast: ToastMessage | null;
  onDone: () => void;
}

export function Toast({ toast, onDone }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDone, toast.tone === "error" ? 5000 : 2600);
    return () => window.clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  return (
    <div
      role="status"
      className={`toast fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium shadow-card ${
        toast.tone === "error" ? "bg-seal text-seal-ink" : "bg-ink text-paper"
      }`}
    >
      {toast.text}
    </div>
  );
}
