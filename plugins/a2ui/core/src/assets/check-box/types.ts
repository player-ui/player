import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

/** Boolean toggle control. */
export interface CheckBoxAsset extends Asset<"CheckBox">, A2UICommon {
  label?: string;
  /** Boolean binding. */
  value?: Binding;
}

export interface TransformedCheckBox extends CheckBoxAsset {
  currentValue: boolean;
  set: (newValue: boolean) => void;
}
