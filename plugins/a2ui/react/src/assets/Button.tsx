import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedButton } from "@player-ui/a2ui-plugin";
import { ButtonComp } from "../components/Button";
import { commonProps } from "../utils";

export const Button = (props: TransformedButton) => {
  const { id, variant = "primary", run, child } = props;
  return (
    <ButtonComp id={id} variant={variant} onClick={run} {...commonProps(props)}>
      {child ? <ReactAsset {...child} /> : null}
    </ButtonComp>
  );
};
