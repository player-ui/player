import React from "react";
import {
  ChatMessage,
  Text,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";

const view1 = (
  <ChatMessage id="1">
    <ChatMessage.Value>
      <Text>Hello World!</Text>
    </ChatMessage.Value>
  </ChatMessage>
);

const flow: DSLFlow = {
  id: "chat-message-basic",
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
