import type { Asset } from "@player-ui/player";
import type { A2UICommon, A2UIChildAsset, A2UIActionFields } from "../common";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

/** Clickable element that triggers an action. */
export interface ButtonAsset
  extends Asset<"Button">, A2UICommon, A2UIActionFields {
  /** Component rendered inside the button (typically a Text). */
  child?: A2UIChildAsset;
  variant?: ButtonVariant;
}

/** Button after the transform: gains `run()` to fire the underlying action. */
export interface TransformedButton extends ButtonAsset {
  run: () => void;
}
