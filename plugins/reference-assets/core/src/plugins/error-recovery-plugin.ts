import { AsyncNodePlugin } from "@player-ui/async-node-plugin";
import { Player, PlayerPlugin } from "@player-ui/player";

export class ErrorRecoveryPlugin implements PlayerPlugin {
  readonly name = "ErrorRecoveryPlugin";
  /** */
  apply(player: Player): void {
    player.applyTo<AsyncNodePlugin>(AsyncNodePlugin.Symbol, (plugin) => {
      plugin.hooks.onAsyncNodeError.tap(this.name, (err, node) => {
        return {
          asset: {
            type: "chat-message",
            id: `${node.id}-recovery`,
            value: {
              asset: {
                id: `${node.id}-recovery-text`,
                type: "text",
                value: "Something went wrong, please try again.",
              },
            },
          },
        };
      });
    });
  }
}
