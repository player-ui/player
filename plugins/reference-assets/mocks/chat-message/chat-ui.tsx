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
  <Collection id="chat-view">
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
      <Text>
        To demonstrate error recovery mechanisms, the message can be sent in
        poorly formatted content that will throw during the transform or at
        render-time of the asset:
      </Text>
      <Action exp={e`sendBroken({{content}})`}>
        <Action.Label> Send Broken Render Asset </Action.Label>
      </Action>
      <Action exp={e`sendBrokenTransform({{content}})`}>
        <Action.Label> Send Broken Transform Asset </Action.Label>
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
