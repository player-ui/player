import { describe, it, expect } from "vitest";
import { runTransform } from "@player-ui/asset-testing-library";
import { chatMessageTransform } from "..";

describe("chatMessage transform", () => {
  it("generates a new multi-node with async node placeholder", () => {
    const ref = runTransform("chat-message", chatMessageTransform, {
      type: "chat-message",
      id: "1",
      value: "Hello World!",
    });

    expect(ref.current).toMatchObject({
      id: expect.any(String),
      type: "collection",
      values: [
        {
          asset: {
            id: "1",
            type: "text",
            value: "Hello World!",
          },
        },
      ],
    });
  });
});
