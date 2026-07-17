import React from "react";
import type { TransformedSlider } from "@player-ui/a2ui-plugin";
import { commonProps } from "../utils";

export const Slider = (props: TransformedSlider) => {
  const { id, minValue = 0, maxValue = 100, currentValue, set } = props;
  return (
    <div
      className="player-flex player-flex-col player-gap-1 player-w-full"
      {...commonProps(props)}
    >
      <input
        id={id}
        type="range"
        min={minValue}
        max={maxValue}
        value={currentValue}
        onChange={(e) => set(Number(e.target.value))}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
        aria-valuenow={currentValue}
        className="player-w-full"
      />
      <span className="player-text-xs player-text-muted-foreground">
        {currentValue}
      </span>
    </div>
  );
};
