import type { Asset } from "@player-ui/player";

export interface ThrowingAsset extends Asset<"text"> {
  /** Message in the error */
  message: string;

  /** When to throw the error */
  timing: "render" | "transform";
}
