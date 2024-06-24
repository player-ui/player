import React from "react";
import { Action, Info } from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Info id="info-view">
    <Info.Title>View Title</Info.Title>
    <Info.Actions>
      <Action value="Next">
        <Action.Label>Continue</Action.Label>
      </Action>
      <Action value="Prev">
        <Action.Label>Back</Action.Label>
      </Action>
    </Info.Actions>
    <Info.Footer>Footer text</Info.Footer>
  </Info>
);

const flow: DSLFlow = {
  id: "info-dynamic-flow",
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
