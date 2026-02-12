import React from "react";
import {
  Collection,
  Text,
  Throwing,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Collection id="view-1">
    <Collection.Label>
      This collection contains an asset that will throw
    </Collection.Label>
    <Collection.Values>
      <Text>
        This is a regular text asset. The next asset will throw an error in its
        transform
      </Text>
      <Throwing message="I throw" timing="transform" />
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: "throw-transform",
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
