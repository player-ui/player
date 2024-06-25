import React from "react";
import { Action, Info } from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Info id="view-1">
    <Info.Title>View 1</Info.Title>
    <Info.Actions>
      <Action value="Next">
        <Action.Label>Continue</Action.Label>
      </Action>
    </Info.Actions>
    <Info.Footer>Footer text</Info.Footer>
  </Info>
);

const view2 = (
  <Info id="view-2">
    <Info.Title>View 2</Info.Title>
    <Info.Actions>
      <Action value="Next">
        <Action.Label>Next</Action.Label>
      </Action>
      <Action value="Dismiss">
        <Action.Label>Dismiss</Action.Label>
      </Action>
    </Info.Actions>
  </Info>
);

const view3 = (
  <Info id="view-3">
    <Info.Title>View 3</Info.Title>
    <Info.Actions>
      <Action value="Next">
        <Action.Label>Next</Action.Label>
      </Action>
    </Info.Actions>
  </Info>
);

const flow: DSLFlow = {
  id: "modal-flow",
  views: [view1, view2, view3],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "VIEW_2",
        },
      },
      VIEW_2: {
        state_type: "VIEW",
        ref: "view-2",
        attributes: {
          stacked: true,
        },
        transitions: {
          Next: "VIEW_3",
          Dismiss: "VIEW_1",
        },
      },
      VIEW_3: {
        state_type: "VIEW",
        ref: "view-3",
        transitions: {
          "*": "VIEW_1",
        },
      },
    },
  },
};

export default flow;
