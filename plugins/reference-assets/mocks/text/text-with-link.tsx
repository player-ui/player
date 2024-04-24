import React from "react";
import {
  Collection,
  Text,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Text
    id="text"
    modifiers={[
      {
        type: "link",
        metaData: {
          "mime-type": "text/html",
          ref: "https://www.intuit.com",
        },
      },
    ]}
  >
    A Link
  </Text>
);

const flow: DSLFlow = {
  id: "text-with-link",
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
