import { describe, it, expect } from "vitest";
import { asyncTransform } from "..";
import { Builder } from "@player-ui/player";

describe("asyncTransform", () => {
  const asset = Builder.asset({
    type: "chat-message",
    id: "1",
    value: {
      id: "2",
      type: "text",
      value: "chat message",
    },
  });

  it("generates wrapper asset with asset", async () => {
    const asset = Builder.asset({
      type: "chat-message",
      id: "1",
      value: {
        id: "2",
        type: "text",
        value: "chat message",
      },
    });

    const transformedAsset = asyncTransform(
      "1",
      "collection",
      asset.value.value,
    );

    expect(transformedAsset).toMatchSnapshot();
  });

  it("generates wrapper asset with flatten is false", async () => {
    const transformedAsset = asyncTransform(
      "1",
      "collection",
      asset.value.value,
      false,
    );

    expect(transformedAsset.children[0].value.values[1].flatten).toBe(false);
  });
});
