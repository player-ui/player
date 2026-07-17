import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { RowAsset } from "@player-ui/a2ui-plugin";
import { cn, commonProps } from "../utils";

const justifyClass: Record<string, string> = {
  start: "player-justify-start",
  center: "player-justify-center",
  end: "player-justify-end",
  spaceBetween: "player-justify-between",
  spaceAround: "player-justify-around",
  spaceEvenly: "player-justify-evenly",
};

const alignClass: Record<string, string> = {
  start: "player-items-start",
  center: "player-items-center",
  end: "player-items-end",
  stretch: "player-items-stretch",
};

export const Row = (props: RowAsset) => {
  const { id, children, justify, align } = props;
  return (
    <div
      id={id}
      className={cn(
        "player-flex player-flex-row player-gap-2",
        justify && justifyClass[justify],
        align && alignClass[align],
      )}
      {...commonProps(props)}
    >
      {children?.map((c, i) => (
        <ReactAsset key={c.asset?.id ?? i} {...c} />
      ))}
    </div>
  );
};
