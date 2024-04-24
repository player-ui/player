import { test, expect } from "vitest";
import React from "react";
import { ReactPlayer } from "@player-ui/react";
import { AssetProviderPlugin } from "..";

/**
 *
 */
const DummyComp = () => <div>Test</div>;

test("loads entries into the web-player registry", () => {
  const rp = new ReactPlayer({
    plugins: [
      new AssetProviderPlugin([
        ["test-string", DummyComp],
        [{ type: "full-match" }, DummyComp],
      ]),
    ],
  });

  expect(rp.assetRegistry.get({ type: "test-string" })).toBe(DummyComp);
  expect(rp.assetRegistry.get({ type: "full-match" })).toBe(DummyComp);
});
