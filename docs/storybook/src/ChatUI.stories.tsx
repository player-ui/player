import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import { ManagedPlayer } from "@player-ui/react";
import { SuspenseSpinner } from "@player-ui/storybook";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import { Node } from "@player-ui/player";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import { createFlowManager } from "./flows/managed";
import chatFlow from "@player-ui/mocks/chat-message/chat.json";

const meta: Meta = {
  title: "React Player/Chat UI",
};

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

const createAsset = (input: string) => {
  count++;
  return {
    asset: {
      id: count,
      type: "chat-message",
      value: {
        asset: {
          id: "value",
          type: "text",
          value: input,
        },
      },
    },
  };
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

export default meta;

export const ChatUI: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin(), asyncNodePlugin, expPlugin]}
          manager={createFlowManager([chatFlow])}
        />
      </SuspenseSpinner>
    );
  },
};
