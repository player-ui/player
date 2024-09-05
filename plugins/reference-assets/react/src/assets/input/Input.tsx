import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedInput } from "@player-ui/reference-assets-plugin";
import { Input as InputComp } from "../../components/Input";
import { Label } from "../../components/Label";

import { useInputAsset } from "./hooks";

/** An Input */
export const Input = (props: TransformedInput) => {
  const { validation, label, id, note } = props;
  const inputProps = useInputAsset(props);

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      {label && (
        <Label htmlFor={id}>
          <ReactAsset {...label} />
        </Label>
      )}
      <InputComp
        id={id}
        aria-invalid={Boolean(validation)}
        aria-describedby={validation ? `${id}-validation` : undefined}
        {...inputProps}
      />
      {validation && (
        <Label
          id={`${id}-validation`}
          className="text-[0.8rem] font-medium text-destructive"
        >
          {validation.message}
        </Label>
      )}
      {note && (
        <Label className="text-[0.8rem] text-muted-foreground">
          <ReactAsset {...note} />
        </Label>
      )}
    </div>
  );
};

export default Input;
