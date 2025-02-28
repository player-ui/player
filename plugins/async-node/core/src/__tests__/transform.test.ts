import { describe, it, expect } from "vitest";
import { asyncTransform } from "..";
import { Builder } from "@player-ui/player";

describe("asyncTransform", () => {
  const asset = Builder.asset({
    id: "2",
    type: "text",
    value: "chat message",
  });

  it("generates wrapper asset with asset", async () => {
    const transformedAsset = asyncTransform("1", "collection", asset);

    expect(transformedAsset).toMatchSnapshot();
  });

  it("generates wrapper asset with flatten is false", async () => {
    const transformedAsset = asyncTransform("1", "collection", asset, false);

    expect(transformedAsset?.children?.[0]?.value.values[1].flatten).toBe(
      false,
    );
  });
});
