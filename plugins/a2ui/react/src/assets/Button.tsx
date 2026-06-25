import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedButton } from "@player-ui/a2ui-plugin";
import { ButtonComp } from "../components/Button";
import { commonProps } from "../utils";
import { openModal } from "../components/modalBus";

export const Button = (props: TransformedButton): React.JSX.Element => {
  const { id, variant = "primary", run, child, value, exp } = props;

  // Actionless buttons (no `value` transition, no `exp` side-effect) double as
  // generic triggers — click fires `openModal(id)` so a Modal whose
  // entryPointChild references this button can subscribe by id.
  const hasAction = Boolean(value || exp);
  const onClick = React.useCallback(() => {
    run?.();
    if (!hasAction) openModal(id ?? "");
  }, [run, hasAction, id]);

  return (
    <ButtonComp
      id={id}
      variant={variant}
      onClick={onClick}
      {...commonProps(props)}
    >
      {child ? <ReactAsset {...child} /> : null}
    </ButtonComp>
  );
};
