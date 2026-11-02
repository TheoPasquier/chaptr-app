import type { ButtonHTMLAttributes } from "react";

type Variant = "ink" | "outline" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm";
  icon?: boolean;
}

export function Button({ variant = "outline", size = "md", icon = false, className = "", type = "button", ...rest }: Props) {
  const cls = ["btn", `btn-${variant}`, size === "sm" && "btn-sm", icon && "btn-icon", className]
    .filter(Boolean)
    .join(" ");
  return <button type={type} className={cls} {...rest} />;
}
