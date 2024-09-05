import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedChoice } from "@player-ui/reference-assets-plugin";
import { ChoiceItem } from "../../components/ChoiceItem";
import { Label } from "../../components/Label";
import type { ChoiceItemProps } from "../../components/ChoiceItem";

import { useChoiceItems } from "./hooks";

/** A Choice */
export const Choice = (props: TransformedChoice) => {
  const { validation, title, id, note } = props;
  const choiceItemProps: Array<ChoiceItemProps> = useChoiceItems(props);

  const renderChoices = () =>
    choiceItemProps.map((choiceItemProp) => (
      <ChoiceItem key={choiceItemProp.id} {...choiceItemProp} />
    ));

  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      {title && (
        <Label htmlFor={id}>
          <ReactAsset {...title} />
        </Label>
      )}
      <div
        id={props.id}
        className="grid gap-2"
        aria-invalid={Boolean(validation)}
        aria-describedby={validation ? `${id}-validation` : undefined}
      >
        {renderChoices()}
      </div>
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

export default Choice;
