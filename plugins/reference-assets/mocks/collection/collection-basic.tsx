import React from "react";
import {
  Collection,
  Text,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Collection id="view-1">
    <Collection.Label>Collections are used to group assets.</Collection.Label>
    <Collection.Values>
      <Text>This is the first item in the collection</Text>
      <Text>This is the second item in the collection</Text>
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: "collection-basic",
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
