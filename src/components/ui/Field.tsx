import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

interface LabelledProps {
  label: ReactNode;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}

/** Libellé + champ, reliés par un id généré. */
export function Labelled({ label, hint, children, className = "" }: LabelledProps) {
  const id = useId();
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-muted">{hint}</span>}
      </label>
      {children(id)}
    </div>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field ${className}`} {...rest} />;
}
