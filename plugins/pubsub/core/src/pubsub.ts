import pubsub from 'pubsub-js';
import type {
  Player,
  PlayerPlugin,
  ExpressionContext,
} from '@player-ui/player';
import { PubSubPluginSymbol } from './symbols';

export interface PubSubConfig {
  /** A custom expression name to register  */
  expressionName: string;
}

/**
 * The PubSubPlugin is a great way to enable your Content content to publish events back to your app
 * It injects a publish() function into the expression language, and will forward all events back to any subscribers.
 *
 * Published/Subscribed events support a hierarchy:
 * - publish('foo', 'data') -- will trigger any listeners for 'foo'
 * - publish('foo.bar', 'data') -- will trigger any listeners for 'foo' or 'foo.bar'
 *
 */
export class PubSubPlugin implements PlayerPlugin {
  name = 'pub-sub';

  static Symbol = PubSubPluginSymbol;
  public readonly symbol = PubSubPlugin.Symbol;

  private expressionName: string;

  constructor(config?: PubSubConfig) {
    this.expressionName = config?.expressionName ?? 'publish';
  }

  apply(player: Player) {
    player.hooks.expressionEvaluator.tap(this.name, (expEvaluator) => {
      expEvaluator.addExpressionFunction(
        this.expressionName,
        (_ctx: ExpressionContext, event: unknown, data: unknown) => {
          if (typeof event === 'string') {
            this.publish(event, data);
          }
        }
      );
    });
  }

  /**
   * A way of publishing an event, notifying any listeners
   *
   * @param event - The name of the event to publish. Can take sub-topics like: foo.bar
   * @param data - Any additional data to attach to the event
   */
  publish(event: string, data: unknown) {
    pubsub.publishSync(event, data);
  }

  /**
   * Subscribe to an event with the given name. The handler will get called for any published event
   *
   * @param event - The name of the event to subscribe to
   * @param handler - A function to be called when the event is triggered
   * @returns A token to be used to unsubscribe from the event
   */
  subscribe(event: string, handler: (e: string, data: unknown) => void) {
    return pubsub.subscribe(event, handler);
  }

  /**
   * Remove any subscriptions using the given token
   *
   * @param token - A token from a `subscribe` call
   */
  unsubscribe(token: string) {
    pubsub.unsubscribe(token);
  }
}
