import { describe, it, expect, vitest } from "vitest";
import { runTransform } from "@player-ui/asset-testing-library";
import { chatMessageTransform } from "..";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { waitFor } from "@testing-library/react";

describe("chatMessage transform", () => {
  it("generates a new multi-node with async node placeholder", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    const test = vitest.fn();

    plugin.hooks.onAsyncNode.tap("test", async (node) => test());

    const ref = runTransform(
      "chat-message",
      chatMessageTransform,
      {
        type: "chat-message",
        id: "1",
        value: {
          asset: {
            id: "1",
            type: "text",
            value: "chat message",
          },
        },
      },
      [plugin],
    );

    /**
     * Check if async node exists in ASTMap after transform and resolve
     * onAsyncNode hook is only called when there is async node
     */
    await waitFor(() => {
      expect(test).toBeCalled();
    });

    expect(ref.current).toMatchObject({
      id: expect.any(String),
      type: "collection",
      values: [
        {
          asset: {
            id: "1",
            type: "text",
            value: "chat message",
          },
        },
      ],
    });

    expect(test).toHaveBeenCalled();
  });
});
