import React from "react";
import { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import { Node } from "@player-ui/player";
import {
    ChatMessage, Choice, Collection,
    Text,
} from "@player-ui/reference-assets-plugin-components";
import { binding as b } from "@player-tools/dsl";
import { AssetWrapper, render } from "@player-tools/dsl";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

const asyncNodePlugin = new AsyncNodePlugin({
  plugins: [new AsyncNodePluginPlugin()],
});

let deferredResolve: ((value: any) => void) | undefined;

asyncNodePlugin.hooks.onAsyncNode.tap(
  "chat",
  async (node: Node.Async, update: (content: any) => void) => {
    const result = new Promise((resolve) => {
      deferredResolve = resolve;
    });

    return result;
  },
);

let count = 1;
let count2 = 100;
let count3 = 1000;
let count4 = 10000;
let count5 = 100000;

const createAsset = async (input: string) => {
  count++;
  count2++;
  return (
    await render(
      <AssetWrapper>
        <ChatMessage id={count.toString()}>
          <ChatMessage.Value>
              <Collection id={count2.toString()}>
                  <Collection.Values>
                      <Text>{input}</Text>
                      <Choice id="choice" binding={b`foo.bar`}>
                          <Choice.Items>
                              <Choice.Item id={count3.toString()} value="Item 1">
                                  <Choice.Item.Label>Item 1</Choice.Item.Label>
                              </Choice.Item>
                              <Choice.Item id={count4.toString()} value="Item 2">
                                  <Choice.Item.Label>Item 2</Choice.Item.Label>
                              </Choice.Item>
                              <Choice.Item id={count5.toString()} value="Item 3">
                                  <Choice.Item.Label>Item 3</Choice.Item.Label>
                              </Choice.Item>
                          </Choice.Items>
                      </Choice>
                  </Collection.Values>
              </Collection>
          </ChatMessage.Value>
        </ChatMessage>
      </AssetWrapper>,
    )
  ).jsonValue;
};
const expPlugin = new ExpressionPlugin(
  new Map([
    [
      "send",
      (ctx, arg1) => {
        deferredResolve && deferredResolve(createAsset(arg1));
      },
    ],
  ]),
);

export const ChatUI = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/chat-message/chat-ui.tsx"),
  { plugins: [asyncNodePlugin, expPlugin] },
);
