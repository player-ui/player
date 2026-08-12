import React from "react";
import { Input } from "@player-ui/reference-assets-plugin-components";
import { binding as b } from "@player-lang/react-dsl";
import type { DSLFlow } from "@player-lang/react-dsl";

const schema = {
  foo: {
    bar: {
      type: "IntegerPosType",
      validation: [
        {
          type: "required",
        },
      ],
    },
  },
};

const view1 = (
  <Input id="input-1" binding={b`foo.bar`}>
    <Input.Label>Input with validation and formatting</Input.Label>
    <Input.Note>It expects a positive integer</Input.Note>
  </Input>
);

const flow: DSLFlow = {
  id: "input-validation",
  views: [view1],
  schema,
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: view1,
        transitions: {
          "*": "END_Done",
        },
      },
      END_Done: {
        state_type: "END",
        outcome: "DONE",
      },
    },
  },
};

export default flow;
