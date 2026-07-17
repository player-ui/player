import React from "react";
import type { DividerAsset } from "@player-ui/a2ui-plugin";
import { Separator } from "../components/Separator";
import { commonProps } from "../utils";

export const Divider = (props: DividerAsset) => {
  const { id, axis = "horizontal" } = props;
  return (
    <Separator
      id={id}
      orientation={axis}
      aria-label={commonProps(props)["aria-label"]}
      style={commonProps(props).style}
    />
  );
};
