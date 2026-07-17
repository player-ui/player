import React from "react";
import type { A2UISnapshot } from "@player-ui/a2ui-plugin";
import { PlayerStory } from "../player";

export type A2UIStoryLoader = () => Promise<
  A2UISnapshot | { default: A2UISnapshot }
>;

/**
 * Story factory for A2UI snapshots. Hands the snapshot directly to
 * `ReactPlayer.start(..., { format: "a2ui" })`, letting Player adapt it on
 * every start. The editor surfaces the raw snapshot JSON, so live edits or
 * arbitrary user-pasted A2UI content re-render through the adapter without
 * a separate build step.
 */
export function createA2UIStory(loader: A2UIStoryLoader, options?: any) {
  const Comp = () => (
    <PlayerStory
      flow={async () => {
        const mod = await loader();
        const snap = "default" in mod ? mod.default : mod;
        return { default: snap };
      }}
      format="a2ui"
      options={options}
    />
  );
  if (options?.args) (Comp as any).args = options.args;
  return { render: Comp };
}
