import type { Asset, Binding } from "@player-ui/player";
import type { A2UICommon } from "../common";

/** Numeric range input. */
export interface SliderAsset extends Asset<"Slider">, A2UICommon {
  value?: Binding;
  minValue?: number;
  maxValue?: number;
}

export interface TransformedSlider extends SliderAsset {
  currentValue: number;
  set: (newValue: number) => void;
}
