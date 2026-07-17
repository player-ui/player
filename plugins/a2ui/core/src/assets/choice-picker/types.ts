import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

export interface ChoicePickerOption {
  label: string;
  value: string;
}

/** Select one or more options from a list. */
export interface ChoicePickerAsset extends Asset<"ChoicePicker">, A2UICommon {
  options?: ChoicePickerOption[];
  /** Binding that stores the array of selected values. */
  selections?: Binding;
  /** When 1, behaves as single-select. Defaults to single-select if omitted. */
  maxAllowedSelections?: number;
}

export interface TransformedChoicePicker extends ChoicePickerAsset {
  currentValue: string[];
  set: (newValue: string[]) => void;
}
