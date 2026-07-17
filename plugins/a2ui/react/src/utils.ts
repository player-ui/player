import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Apply common A2UI presentation hints (weight, accessibility) to props. */
export interface CommonPresentation {
  weight?: number;
  accessibility?: string;
}

export function commonProps(p: CommonPresentation) {
  const out: { style?: React.CSSProperties; "aria-label"?: string } = {};
  if (p.weight !== undefined) out.style = { flexGrow: p.weight };
  if (p.accessibility) out["aria-label"] = p.accessibility;
  return out;
}
