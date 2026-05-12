import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { CardAsset } from "@player-ui/a2ui-plugin";
import { CardComp } from "../components/Card";
import { commonProps } from "../utils";

export const Card = (props: CardAsset) => {
  const { id, child } = props;
  return (
    <CardComp id={id} {...commonProps(props)}>
      {child ? <ReactAsset {...child} /> : null}
    </CardComp>
  );
};
