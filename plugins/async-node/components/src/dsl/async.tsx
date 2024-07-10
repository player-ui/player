import React from "react";
import type { ObjectNode } from "react-json-reconciler";

export type AsyncNodeProps = {
  id?: string;
};

export const AsyncNode = React.forwardRef<ObjectNode, AsyncNodeProps>(
  (props) => {
    const { id } = props;
    const Wrapper = React.Fragment;

    return (
      <Wrapper>
        <obj>
          <property name="id">{id}</property>
          <property name="async">true</property>
        </obj>
      </Wrapper>
    );
  },
);

AsyncNode.displayName = "AsyncNode";
