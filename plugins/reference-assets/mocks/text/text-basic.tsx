import React from "react";
import {
  Collection,
  Text,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <Collection>
    <Collection.Values>
      <Text>This is some text</Text>
      <Text
        modifiers={[
          {
            type: "link",
            metaData: {
              ref: "https://www.intuit.com",
            },
          },
        ]}
      >
        This is some text that is a link
      </Text>
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: "text-basic",
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
