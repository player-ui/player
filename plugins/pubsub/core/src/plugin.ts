import type {
  Player,
  PlayerPlugin,
  ExpressionContext,
} from "@player-ui/player";
import type { SubscribeHandler } from "./pubsub";
import { pubsub, TinyPubSub } from "./pubsub";
import { PubSubPluginSymbol } from "./symbols";

export interface PubSubConfig {
  /** A custom expression name to register  */
  expressionName?: string;
  /**
   * An external TinyPubSub instance to use instead of creating a new one.
   * When provided, this instance is always used and will not be replaced by
   * another registered PubSubPlugin's instance on the same player.
   * This allows sharing a single pubsub bus across multiple plugins or players.
   */
  pubsub?: TinyPubSub;
}

/**
 * The PubSubPlugin is a great way to enable your FRF content to publish events back to your app
 * It injects a publish() function into the expression language, and will forward all events back to any subscribers.
 *
 * Published/Subscribed events support a hierarchy:
 * - publish('foo', 'data') -- will trigger any listeners for 'foo'
 * - publish('foo.bar', 'data') -- will trigger any listeners for 'foo' or 'foo.bar'
 *
 */
export class PubSubPlugin implements PlayerPlugin {
  name = "pub-sub";

  static Symbol: symbol = PubSubPluginSymbol;
  public readonly symbol: symbol = PubSubPlugin.Symbol;

  protected pubsub: TinyPubSub;

  private expressionName: string;

  private usesExternalPubSub: boolean;

  constructor(config?: PubSubConfig) {
    this.expressionName = config?.expressionName ?? "publish";
    this.pubsub = config?.pubsub ?? pubsub;
    this.usesExternalPubSub = config?.pubsub !== undefined;
  }

  apply(player: Player): void {
    // if there is already a pubsub plugin and no external pubsub was provided,
    // reuse its pubsub instance to maintain the singleton across bundles for iOS/Android
    if (!this.usesExternalPubSub) {
      const existing = player.findPlugin<PubSubPlugin>(PubSubPluginSymbol);
      if (existing !== undefined) {
        this.pubsub = existing.pubsub;
      }
    }

    player.hooks.expressionEvaluator.tap(this.name, (expEvaluator) => {
      const existingExpression = expEvaluator.operators.expressions.get(
        this.expressionName,
      );

      if (existingExpression) {
        player.logger.warn(
          `[PubSubPlugin] expression ${this.expressionName} is already registered.`,
        );
      } else {
        expEvaluator.addExpressionFunction(
          this.expressionName,
          (_ctx: ExpressionContext, event: unknown, ...args: unknown[]) => {
            if (typeof event === "string") {
              this.publish(event, ...args);
            }
          },
        );
      }
    });

    player.hooks.onEnd.tap(this.name, () => {
      this.clear();
    });
  }

  /**
   * A way of publishing an event, notifying any listeners
   *
   * @param event - The name of the event to publish. Can take sub-topics like: foo.bar
   * @param data - Any additional data to attach to the event
   */
  publish(event: string, ...args: unknown[]): void {
    this.pubsub.publish(event, ...args);
  }

  /**
   * Subscribe to an event with the given name. The handler will get called for any published event
   *
   * @param event - The name of the event to subscribe to
   * @param handler - A function to be called when the event is triggered
   * @returns A token to be used to unsubscribe from the event
   */
  subscribe<T extends string, A extends unknown[]>(
    event: T,
    handler: SubscribeHandler<T, A>,
  ): string {
    return this.pubsub.subscribe(event, handler);
  }

  /**
   * Remove any subscriptions using the given token
   *
   * @param token - A token from a `subscribe` call
   */
  unsubscribe(token: string): void {
    this.pubsub.unsubscribe(token);
  }

  /**
   * Remove all subscriptions
   */
  clear(): void {
    this.pubsub.clear();
  }
}
