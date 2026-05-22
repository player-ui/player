import type { Player, PlayerPlugin } from "@player-ui/player";
import { adaptA2UIToFlow } from "../a2ui";
import type { A2UISnapshot } from "../a2ui";

/**
 * Convert A2UI snapshots into Player Flows. Taps the `transformContent` hook
 * and activates only when the caller passes `{ format: "a2ui" }` to
 * `Player.start()`. Other formats pass through unchanged so multiple content
 * plugins can coexist on a single Player instance.
 *
 * `meta.version` is forwarded but currently ignored — v0.9 is the only
 * supported A2UI version. Future major-version dispatch belongs here.
 */
export class A2UIContentPlugin implements PlayerPlugin {
  name = "a2ui-content";

  apply(player: Player): void {
    player.hooks.transformContent.tap("a2ui-content", (content, meta) => {
      if (meta.format !== "a2ui") return content;
      return adaptA2UIToFlow(
        content as A2UISnapshot,
        (player as unknown as { logger: Parameters<typeof adaptA2UIToFlow>[1] })
          .logger,
      );
    });
  }
}
