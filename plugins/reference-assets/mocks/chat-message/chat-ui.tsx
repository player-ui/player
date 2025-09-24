import React from "react";
import {
  ChatMessage,
  Text,
  Input,
  Collection,
  Action,
} from "@player-ui/reference-assets-plugin-components";
import type { DSLFlow } from "@player-tools/dsl";
import { binding as b } from "@player-tools/dsl";
import { expression as e } from "@player-tools/dsl";

const view1 = (
  <Collection>
    <Collection.Values>
      <ChatMessage id="chat-demo">
        <ChatMessage.Value>
          <Text>Start chatting now!</Text>
        </ChatMessage.Value>
      </ChatMessage>

      <Input id="input" binding={b`content`}></Input>
      <Action exp={e`send({{content}})`}>
        <Action.Label> Send </Action.Label>
      </Action>
    </Collection.Values>
  </Collection>
);

const flow: DSLFlow = {
  id: "chat-ui",
  data: {
    content: "",
  },
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
