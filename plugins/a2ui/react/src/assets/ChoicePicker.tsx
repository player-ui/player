import React from "react";
import type { TransformedChoicePicker } from "@player-ui/a2ui-plugin";
import { Label } from "../components/Label";
import { commonProps } from "../utils";

export const ChoicePicker = (props: TransformedChoicePicker) => {
  const {
    id,
    options = [],
    currentValue,
    set,
    maxAllowedSelections = 1,
  } = props;
  const multi = maxAllowedSelections !== 1;

  function toggle(value: string) {
    if (!multi) {
      set([value]);
      return;
    }
    const has = currentValue.includes(value);
    const next = has
      ? currentValue.filter((v) => v !== value)
      : [...currentValue, value];
    if (!has && next.length > maxAllowedSelections) return;
    set(next);
  }

  return (
    <div
      id={id}
      role={multi ? "group" : "radiogroup"}
      className="player-flex player-flex-col player-gap-2"
      {...commonProps(props)}
    >
      {options.map((opt) => {
        const checked = currentValue.includes(opt.value);
        const optId = `${id}-${opt.value}`;
        return (
          <div
            key={opt.value}
            className="player-flex player-items-center player-gap-2"
          >
            <input
              id={optId}
              type={multi ? "checkbox" : "radio"}
              name={id}
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="player-h-4 player-w-4"
            />
            <Label htmlFor={optId}>{opt.label}</Label>
          </div>
        );
      })}
    </div>
  );
};
