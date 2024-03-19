/**
 * Based off the pubsub-js library and rewritten to match the same used APIs but modified so that
 * multiple arguments could be passed into the publish and subscription handlers.
 */

export type SubscribeHandler<T extends string, A extends unknown[]> = (
  type: T,
  ...args: A
) => void;

export type PubSubUUID = `uuid_${number}`;

/**
 * Split a string into an array of event layers
 */
function splitEvent(event: string) {
  return event.split('.').reduce<string[]>((prev, curr, index) => {
    if (index === 0) {
      return [curr];
    }

    return [...prev, `${prev[index - 1]}.${curr}`];
  }, []);
}

let count = 1;

/**
 * Tiny pubsub maker
 */
export class TinyPubSub {
  private events: Map<string, Map<PubSubUUID, SubscribeHandler<any, any>>>;
  private tokens: Map<PubSubUUID, string>;

  constructor() {
    this.events = new Map();
    this.tokens = new Map();
  }

  /**
   * Publish an event with any number of additional arguments
   */
  publish(event: string, ...args: unknown[]) {
    if (typeof event !== 'string') {
      return;
    }

    if (event.includes('.')) {
      const eventKeys = splitEvent(event);

      eventKeys.forEach((key) => {
        this.deliver(key, event, ...args);
      });
    } else {
      this.deliver(event, event, ...args);
    }

    this.deliver('*', event, ...args);
  }

  /**
   * Subscribe to an event
   *
   * Events are also heirarchical when separated by a period. Given the following:
   *
   * publish('a.b.c', 'one', 'two', 'three)
   *
   * The subscribe event will be called when the event is passed as 'a', 'a.b', or 'a.b.c'.
   *
   * @example
   * // subscribes to the top level 'a' publish
   * subscribe('a', (event, ...args) => console.log(event, ...args))
   */
  subscribe(event: string, handler: SubscribeHandler<any, any>) {
    const uuid = `uuid_${++count}`;

    if (typeof event === 'string') {
      if (!this.events.has(event)) {
        this.events.set(event, new Map());
      }

      const handlers = this.events.get(event);
      handlers!.set(uuid as PubSubUUID, handler);
      this.tokens.set(uuid as PubSubUUID, event);
    }

    return uuid;
  }

  /**
   * Unsubscribes to a specific subscription given it's symbol or an entire
   * event when passed as a string.
   *
   * When existing subscriptions exist for heirarchical events such as 'a.b.c',
   * when passing an event 'a' to unsubscribe, all subscriptions for 'a', 'a.b',
   * & 'a.b.c' will be unsubscribed as well.
   */
  unsubscribe(value: string | symbol) {
    if (typeof value === 'string' && value.startsWith('uuid')) {
      const path = this.tokens.get(value as PubSubUUID);

      if (typeof path === 'undefined') {
        return;
      }

      const innerPath = this.events.get(path);
      innerPath?.delete(value as PubSubUUID);
      this.tokens.delete(value as PubSubUUID);
      return;
    }

    if (typeof value === 'string') {
      for (const key of this.events.keys()) {
        if (key.indexOf(value) === 0) {
          const tokens = this.events.get(key);

          if (tokens && tokens.size) {
            // eslint-disable-next-line max-depth
            for (const token of tokens.keys()) {
              this.tokens.delete(token);
            }
          }

          this.events.delete(key);
        }
      }
    }
  }

  /**
   * Get the number of subscriptions for a specific event, or when left blank
   * will return the overall number of subscriptions for the entire pubsub.
   */
  count(event?: string) {
    let counter = 0;

    if (typeof event === 'undefined') {
      for (const handlers of this.events.values()) {
        counter += handlers.size;
      }

      return counter;
    }

    const handlers = this.events.get(event);

    if (handlers?.size) {
      return handlers.size;
    }

    return counter;
  }

  /**
   * Deletes all existing subscriptions
   */
  clear() {
    this.events.clear();
    this.tokens.clear();
  }

  private deliver(path: string, event: string, ...args: unknown[]) {
    const handlers = this.events.get(path);

    if (handlers && handlers.size) {
      for (const handler of handlers.values()) {
        handler(event, ...args);
      }
    }
  }
}

export const pubsub = new TinyPubSub();
