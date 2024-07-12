import React from "react";
import { Input } from "@player-ui/reference-assets-plugin-components";
import { binding as b } from "@player-tools/dsl";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Input id="input" binding={b`foo.bar`}>
    <Input.Label>This is an input</Input.Label>
    <Input.Note>This is a note</Input.Note>
  </Input>
);

const flow: DSLFlow = {
  id: "input-basic",
  views: [view1],
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
