import React from "react";
import { Action, Input } from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";
import { expression as e, makeBindingsForObject } from "@player-tools/dsl";

export const baseSchema = {
  controls: {
    actionLabel: {
      type: "StringType",
    },
  },
};

const data = makeBindingsForObject(baseSchema);

const view1 = (
  <Input binding={data.controls.actionLabel}>
    <Input.Label>Action Label</Input.Label>
  </Input>
);

const flow: DSLFlow = {
  id: "action-basic-controls",
  views: [view1],
  data: {
    controls: {
      actionLabel: "Count",
    },
  },
  schema: baseSchema,
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
