import { describe, it, expect } from "vitest";
import { asyncTransform } from "..";
import { Builder } from "@player-ui/player";

describe("asyncTransform", () => {
  it("generates wrapper asset", async () => {
    const asset = Builder.asset({
      type: "chat-message",
      id: "1",
      value: "Hello World!",
    });

    const transformedAsset = asyncTransform(asset, "text", "collection");

    expect(transformedAsset).toMatchSnapshot();
  });

  it("generates wrapper asset with flatten is false", async () => {
    const asset = Builder.asset({
      type: "chat-message",
      id: "1",
      value: "Hello World!",
    });

    const transformedAsset = asyncTransform(asset, "text", "collection", false);

    expect(transformedAsset.children[0].value.values[1].flatten).toBe(false);
  });
});
