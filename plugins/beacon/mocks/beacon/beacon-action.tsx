import React from "react";
import { Action, Text } from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-lang/react-dsl";
import { binding as b, expression as e } from "@player-lang/react-dsl";

const count = b`count`;

const view1 = (
  <Action
    id="action"
    exp={[e`${count} = ${count} + 1`, e`beacon('action', 'some-data')`]}
    metaData={{
      beacon: `Click count: ${count}`,
    }}
  >
    <Action.Label>
      <Text id="action-label-text">Clicked {count} times</Text>
    </Action.Label>
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
