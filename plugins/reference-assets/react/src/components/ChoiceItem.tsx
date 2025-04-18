import React from "react";
import { ReactAsset } from "@player-ui/react";
import { Input as InputComp } from "./Input";
import { Label } from "./Label";
import type { ChoiceItem as ChoiceItemType } from "@player-ui/reference-assets-plugin";

export type ChoiceItemProps = React.InputHTMLAttributes<HTMLInputElement> &
  Pick<ChoiceItemType, "label">;

/** A choice item */
export const ChoiceItem = (props: ChoiceItemProps) => {
  const { label, id, ...rest } = props;

  return (
    <div className="player-flex player-items-center player-gap-1.5">
      <InputComp
        type="radio"
        className="player-h-fit player-w-fit player-shadow-none"
        id={id}
        {...rest}
      />
      {label && (
        <Label htmlFor={id}>
          <ReactAsset {...label} />
        </Label>
      )}
    </div>
  );
};

export default ChoiceItem;
