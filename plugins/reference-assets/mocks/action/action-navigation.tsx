import React from "react";
import {
  Action,
  Collection,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Collection id="view-1">
    <Collection.Label>View 1</Collection.Label>
    <Collection.Values>
      <Action
        value="Prev"
        metaData={{
          role: "",
        }}
      >
        <Action.Label>Go Back Without Icon</Action.Label>
      </Action>
      <Action
        id="action-prev-without-icon"
        value="Prev"
        metaData={{
          role: "back",
        }}
      >
        <Action.Label>Go Back With Role</Action.Label>
      </Action>
      <Action id="action-next" value="Next">
        <Action.Label>Next</Action.Label>
      </Action>
    </Collection.Values>
  </Collection>
);

const view2 = (
  <Collection id="view-2">
    <Collection.Label>View 2</Collection.Label>
    <Collection.Values>
      <Action id="action-prev" value="Prev">
        <Action.Label>Go Back</Action.Label>
      </Action>
      <Action id="action-next" value="Next">
        <Action.Label>End</Action.Label>
      </Action>
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: "action-navigation",
  views: [view1, view2],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          Next: "VIEW_2",
          Prev: "END",
        },
      },
      VIEW_2: {
        state_type: "VIEW",
        ref: "view-2",
        transitions: {
          Next: "END",
          Prev: "VIEW_1",
        },
      },
      END: {
        state_type: "END",
        outcome: "done",
      },
    },
  },
};

export default flow;
