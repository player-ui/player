import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

export type ImageFit = "contain" | "cover" | "fill" | "none";
export type ImageVariant = "default" | "rounded" | "circle";

/** Display images from URLs. */
export interface ImageAsset extends Asset<"Image">, A2UICommon {
  url?: string | Binding;
  fit?: ImageFit;
  variant?: ImageVariant;
}
