import React from "react";
import type { TransformedDateTimeInput } from "@player-ui/a2ui-plugin";
import { InputComp } from "../components/Input";
import { commonProps } from "../utils";

function pickInputType(enableDate?: boolean, enableTime?: boolean) {
  if (enableDate && enableTime) return "datetime-local";
  if (enableTime) return "time";
  return "date";
}

export const DateTimeInput = (props: TransformedDateTimeInput) => {
  const {
    id,
    currentValue,
    set,
    enableDate = true,
    enableTime = false,
  } = props;
  return (
    <InputComp
      id={id}
      type={pickInputType(enableDate, enableTime)}
      value={currentValue}
      onChange={(e) => set(e.target.value)}
      {...commonProps(props)}
    />
  );
};
