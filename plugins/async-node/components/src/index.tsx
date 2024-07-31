import React from "react";
import type { ObjectNode } from "react-json-reconciler";

export type AsyncNodeProps = {
  id: string;
};

export const AsyncNode = React.forwardRef<ObjectNode, AsyncNodeProps>(
  ({ id }, ref) => {
    return (
      <obj ref={ref}>
        <property name="id">{id}</property>
        <property name="async">true</property>
      </obj>
    );
  },
);

AsyncNode.displayName = "AsyncNode";
