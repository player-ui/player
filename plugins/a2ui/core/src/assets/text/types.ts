import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

export type TextVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";

/** Display text content with styling guidance. */
export interface TextAsset extends Asset<"Text">, A2UICommon {
  /** The text to display. May be a literal string or a model binding (DataBinding) post-adapter. */
  text?: string | Binding;
  variant?: TextVariant;
}
