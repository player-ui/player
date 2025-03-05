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
  "async-chat",
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
        console.log("ctx from exp:", ctx);
        console.log("arg1 from exp:", arg1);

        console.log("expression handler called");
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
          manager={createFlowManager([
            // {
            //   id: "chat-ui",
            //   views: [
            //     {
            //       id: "root",
            //       type: "collection",
            //       values: [
            //         {
            //           asset: {
            //             id: "1",
            //             type: "chat-message",
            //             value: {
            //               asset: {
            //                 id: "values-0-value",
            //                 type: "text",
            //                 value: "Start chatting now!",
            //               },
            //             },
            //           },
            //         },
            //         {
            //           asset: {
            //             id: "input",
            //             type: "input",
            //             binding: "content",
            //           },
            //         },
            //         {
            //           asset: {
            //             id: "values-2",
            //             type: "action",
            //             exp: "send({{content}})",
            //             label: {
            //               asset: {
            //                 id: "values-2-label",
            //                 type: "text",
            //                 value: " Send ",
            //               },
            //             },
            //           },
            //         },
            //       ],
            //     },
            //   ],
            //   navigation: {
            //     BEGIN: "FLOW_1",
            //     data: {
            //       content: "",
            //     },
            //     FLOW_1: {
            //       startState: "VIEW_1",
            //       VIEW_1: {
            //         state_type: "VIEW",
            //         ref: "root",
            //         transitions: {
            //           "*": "END_Done",
            //         },
            //       },
            //       END_Done: {
            //         state_type: "END",
            //         outcome: "DONE",
            //       },
            //     },
            //   },
            // },
            chatFlow,
          ])}
        />
      </SuspenseSpinner>
    );
  },
};
