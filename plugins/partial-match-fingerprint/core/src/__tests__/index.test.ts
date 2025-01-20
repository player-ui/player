import { test, expect } from "vitest";
import { Player } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { makeFlow } from "@player-ui/make-flow";
import { PartialMatchFingerprintPlugin } from "..";

const action = makeFlow({
  id: "action",
  type: "action",
  value: "Next",
  metaData: {
    role: "someRole",
  },
});

test("Should match just on type", () => {
  const plugin = new PartialMatchFingerprintPlugin(new Registry());
  plugin.register({ type: "action" }, 0);
  const player = new Player({ plugins: [plugin] });
  player.start(action as any);

  expect(plugin.get("action")).toBe(0);
});

test("Should match just on type and metaData", () => {
  const plugin = new PartialMatchFingerprintPlugin(new Registry());
  plugin.register({ type: "action" }, 0);
  plugin.register({ type: "action", metaData: { role: "someRole" } }, 1);
  const player = new Player({ plugins: [plugin] });
  player.start(action as any);

  expect(plugin.get("action")).toBe(1);
});

test("Should return undefined if assetId has no match", () => {
  const plugin = new PartialMatchFingerprintPlugin(new Registry());
  plugin.register({ type: "action" }, 0);
  const player = new Player({ plugins: [plugin] });
  player.start(action as any);

  expect(plugin.get("label")).toBeUndefined();
});
