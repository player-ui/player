import type { Player, PlayerPlugin, InProgressState } from "@player-ui/player";
import { getPubSubPlugin } from "./utils";

export type PubSubHandler<T extends unknown[]> = (
  context: InProgressState,
  ...args: T
) => void;

export type SubscriptionMap = Map<string, PubSubHandler<any>>;

/**
 * Plugin to easily add subscribers to the PubSubPlugin
 */
export class PubSubHandlerPlugin implements PlayerPlugin {
  name = "pubsub-handler";
  private subscriptions: SubscriptionMap;

  constructor(subscriptions: SubscriptionMap) {
    this.subscriptions = subscriptions;
  }

  apply(player: Player) {
    const pubsub = getPubSubPlugin(player);

    player.hooks.onStart.tap(this.name, () => {
      this.subscriptions.forEach((handler, key) => {
        pubsub.subscribe(key, (_, ...args) => {
          const state = player.getState();

          if (state.status === "in-progress") {
            return handler(state, ...args);
          }

          player.logger.info(
            `[PubSubHandlerPlugin] subscriber for ${key} was called when player was not in-progress`,
          );
        });
      });
    });
  }
}
