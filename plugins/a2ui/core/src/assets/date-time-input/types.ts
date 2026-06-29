import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

/** Date and/or time picker interface. */
export interface DateTimeInputAsset extends Asset<"DateTimeInput">, A2UICommon {
  value?: Binding;
  /** When true, the date portion is shown. */
  enableDate?: boolean;
  /** When true, the time portion is shown. */
  enableTime?: boolean;
}

export interface TransformedDateTimeInput extends DateTimeInputAsset {
  currentValue: string;
  set: (newValue: string) => void;
}
