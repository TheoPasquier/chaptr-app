import { fmtNum } from "@/lib/format";

interface Props {
  num: number;
  size?: "sm" | "md" | "lg";
  stamped?: boolean;
  animate?: boolean;
  className?: string;
}

const SIZES = { sm: "text-xs", md: "text-base", lg: "text-2xl" };

/** Le marque-page : numéro du dernier chapitre lu sur un sceau rouge. */
export function Seal({ num, size = "md", stamped = false, animate = false, className = "" }: Props) {
  return (
    <span
      className={["seal", SIZES[size], stamped && "seal-stamped", animate && "seal-animate", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`Chapitre ${fmtNum(num)}`}
    >
      {fmtNum(num)}
    </span>
  );
}
