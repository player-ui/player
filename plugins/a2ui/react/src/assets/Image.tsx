import React from "react";
import type { ImageAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

const fitClass: Record<string, string> = {
  contain: "player-object-contain",
  cover: "player-object-cover",
  fill: "player-object-fill",
  none: "player-object-none",
};

const variantClass: Record<string, string> = {
  default: "",
  rounded: "player-rounded-md",
  circle: "player-rounded-full",
};

export const Image = (props: ImageAsset) => {
  const { id, url, fit = "cover", variant = "default" } = props;
  return (
    <img
      id={id}
      src={typeof url === "string" ? url : ""}
      alt={props.accessibility ?? ""}
      className={cn(
        "player-max-w-full player-h-auto",
        fitClass[fit],
        variantClass[variant],
      )}
      style={commonProps(props).style}
    />
  );
};
