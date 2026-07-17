import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { ListAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

const alignClass: Record<string, string> = {
  start: "player-items-start",
  center: "player-items-center",
  end: "player-items-end",
  stretch: "player-items-stretch",
};

export const List = (props: ListAsset) => {
  const { id, children, direction = "vertical", align } = props;
  return (
    <div
      id={id}
      role="list"
      className={cn(
        "player-flex player-gap-2 player-overflow-auto",
        direction === "vertical" ? "player-flex-col" : "player-flex-row",
        align && alignClass[align],
      )}
      {...commonProps(props)}
    >
      {children?.map((c, i) => (
        <div role="listitem" key={c.asset?.id ?? i}>
          <ReactAsset {...c} />
        </div>
      ))}
    </div>
  );
};
