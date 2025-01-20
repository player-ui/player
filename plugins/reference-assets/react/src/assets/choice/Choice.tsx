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
    <div className="player-grid player-w-full player-max-w-sm player-items-center player-gap-3">
      {title && (
        <Label htmlFor={id}>
          <ReactAsset {...title} />
        </Label>
      )}
      <div
        id={props.id}
        className="player-grid player-gap-2"
        aria-invalid={Boolean(validation)}
        aria-describedby={validation ? `${id}-validation` : undefined}
      >
        {renderChoices()}
      </div>
      {validation && (
        <Label
          id={`${id}-validation`}
          className="player-text-[0.8rem] player-font-medium player-text-destructive"
        >
          {validation.message}
        </Label>
      )}
      {note && (
        <Label className="player-text-[0.8rem] player-text-muted-foreground">
          <ReactAsset {...note} />
        </Label>
      )}
    </div>
  );
};

export default Choice;
