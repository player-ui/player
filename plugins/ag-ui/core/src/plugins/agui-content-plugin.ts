import type { Player, PlayerPlugin } from "@player-ui/player";
import { buildSessionFlow } from "../session/adapter";
import type { AGUIAgent } from "../session/types";

/**
 * Replace the `start()` payload with the synthetic AG-UI session flow when
 * `meta.format === "ag-ui"`. The original payload is expected to be the
 * agent itself (`AbstractAgent` / `HttpAgent`-shaped); the session plugin
 * receives the agent via constructor injection, so the content plugin's only
 * job is the flow swap.
 *
 * Other formats pass through unchanged so this plugin coexists with the A2UI
 * content plugin on a single Player instance.
 */
export class AGUIContentPlugin implements PlayerPlugin {
  name = "ag-ui-content";

  constructor(private readonly opts: { agent: AGUIAgent }) {}

  apply(player: Player): void {
    player.hooks.transformContent.tap("ag-ui-content", (content, meta) => {
      if (meta.format !== "ag-ui") return content;
      return buildSessionFlow(this.opts.agent.threadId);
    });
  }
}
