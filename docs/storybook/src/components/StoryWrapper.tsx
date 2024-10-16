import type { PropsWithChildren } from "react";
import React from "react";

export const StoryWrapper = (props: PropsWithChildren<any>) => {
  return <div style={{ padding: "20px" }}>{props.children}</div>;
};
