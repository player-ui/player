import React from "react";
import { Action } from "@player-ui/reference-assets-plugin-components";
import { expression as e } from "@player-lang/react-dsl";
import type { DSLFlow } from "@player-lang/react-dsl";

const view1 = (
  <Action id="action" exp={e`publish('some-event', 'event published message')`}>
    <Action.Label>Clicked to publish event</Action.Label>
  </Action>
);

const flow: DSLFlow = {
  id: "generated-flow",
  views: [view1],
  data: {
    count: 0,
  },
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
        outcome: "done",
      },
    },
  },
};

export default flow;
