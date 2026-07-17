import React from "react";
import type { TransformedCheckBox } from "@player-ui/a2ui-plugin";
import { Label } from "../components/Label";
import { commonProps } from "../utils";

export const CheckBox = (props: TransformedCheckBox) => {
  const { id, label, currentValue, set } = props;
  return (
    <div
      className="player-flex player-items-center player-gap-2"
      {...commonProps(props)}
    >
      <input
        id={id}
        type="checkbox"
        checked={currentValue}
        onChange={(e) => set(e.target.checked)}
        className="player-h-4 player-w-4 player-rounded player-border-input player-text-primary focus-visible:player-ring-1 focus-visible:player-ring-ring"
      />
      {label && <Label htmlFor={id}>{label}</Label>}
    </div>
  );
};
