import type { Player, PlayerPlugin, Flow } from "@player-ui/player";
import { SyncHook, SyncWaterfallHook } from "tapable-ts";
import { ContextStore } from "./store";
import { ContextHistory } from "./history";
import { ContextPluginSymbol } from "./symbols";
import { defineContextKey, nameOfContextKey } from "./key";
import type {
  ContextEntryDescriptor,
  ContextGlobalSubscriber,
  ContextKey,
  ContextSubscriber,
  ContextTransform,
  FrozenContextSnapshot,
  SubscriptionToken,
} from "./types";

type TransformRegistration = {
  key: ContextKey;
  transform: ContextTransform<unknown>;
};

let subscriptionCounter = 0;

/**
 * Maintains a per-flow store of context entries keyed by symbol, with
 * registered transforms for derived values and a subscription API for
 * external consumers. On flow end the active store is frozen into a snapshot
 * and pushed onto a history stack; a fresh store is created for the next flow,
 * with transforms re-applied. Subscribers persist across flow rotations.
 */
export class ContextPlugin implements PlayerPlugin {
  name = "context";

  static Symbol: symbol = ContextPluginSymbol;
  public readonly symbol: symbol = ContextPlugin.Symbol;

  public readonly hooks = {
    onSet: new SyncHook<[ContextKey, unknown]>(),
    resolveValue: new SyncWaterfallHook<[unknown, ContextKey]>(),
    onRegister: new SyncHook<[ContextKey]>(),
    onFlowFrozen: new SyncHook<[FrozenContextSnapshot]>(),
  };

  protected store: ContextStore;
  protected historyStack: ContextHistory;
  private transforms = new Map<symbol, TransformRegistration>();
  private perKeySubs = new Map<
    symbol,
    Map<SubscriptionToken, ContextSubscriber<unknown>>
  >();
  private globalSubs = new Map<SubscriptionToken, ContextGlobalSubscriber>();
  private tokenIndex = new Map<SubscriptionToken, symbol | undefined>();
  private currentFlowId: string | undefined;

  constructor() {
    this.store = new ContextStore();
    this.historyStack = new ContextHistory();
  }

  apply(player: Player) {
    const existing = player.findPlugin<ContextPlugin>(ContextPluginSymbol);
    if (existing !== undefined && existing !== this) {
      this.store = existing.store;
      this.historyStack = existing.historyStack;
      this.transforms = existing.transforms;
      this.perKeySubs = existing.perKeySubs;
      this.globalSubs = existing.globalSubs;
      this.tokenIndex = existing.tokenIndex;
      return;
    }

    player.hooks.onStart.tap(this.name, (flow: Flow) => {
      this.currentFlowId = flow?.id;
    });

    player.hooks.onEnd.tap(this.name, () => {
      const snapshot = this.store.freeze({
        flowId: this.currentFlowId,
        endedAt: Date.now(),
      });
      this.historyStack.push(snapshot);
      this.hooks.onFlowFrozen.call(snapshot);
      this.rotateStore();
      this.currentFlowId = undefined;
    });
  }

  register<Value>(key: ContextKey<Value>): void {
    const added = this.store.register(key);
    if (added) {
      this.hooks.onRegister.call(key);
    }
  }

  set<Value>(key: ContextKey<Value>, value: Value): void {
    const isFirstSighting = !this.store.has(key);
    this.store.set(key, value);
    if (isFirstSighting) {
      this.hooks.onRegister.call(key);
    }
    this.notify(key, value);

    const dependents = this.store.dependentsOf(key.symbol);
    for (const dep of dependents) {
      const computed = this.store.get(dep);
      this.notify(dep, computed);
    }
  }

  get<Value>(key: ContextKey<Value>): Value | undefined {
    const raw = this.store.get(key);
    const resolved = this.hooks.resolveValue.call(raw, key);
    return resolved as Value | undefined;
  }

  has(key: ContextKey): boolean {
    return this.store.has(key);
  }

  registerTransform<Value>(
    key: ContextKey<Value>,
    transform: ContextTransform<Value>,
  ): void {
    const isFirstSighting = !this.store.has(key);
    this.store.registerTransform(key, transform);
    this.transforms.set(key.symbol, {
      key,
      transform: {
        sources: transform.sources,
        compute: transform.compute as ContextTransform<unknown>["compute"],
      },
    });
    if (isFirstSighting) {
      this.hooks.onRegister.call(key);
    }
  }

  subscribe<Value>(
    key: ContextKey<Value>,
    handler: ContextSubscriber<Value>,
  ): SubscriptionToken {
    const token = this.nextToken();
    let bucket = this.perKeySubs.get(key.symbol);
    if (!bucket) {
      bucket = new Map();
      this.perKeySubs.set(key.symbol, bucket);
    }
    bucket.set(token, handler as ContextSubscriber<unknown>);
    this.tokenIndex.set(token, key.symbol);
    return token;
  }

  subscribeAll(handler: ContextGlobalSubscriber): SubscriptionToken {
    const token = this.nextToken();
    this.globalSubs.set(token, handler);
    this.tokenIndex.set(token, undefined);
    return token;
  }

  unsubscribe(token: SubscriptionToken): void {
    const owner = this.tokenIndex.get(token);
    if (owner === undefined) {
      this.globalSubs.delete(token);
    } else {
      this.perKeySubs.get(owner)?.delete(token);
    }
    this.tokenIndex.delete(token);
  }

  list(): ReadonlyArray<ContextEntryDescriptor> {
    return this.store.list();
  }

  history(): ReadonlyArray<FrozenContextSnapshot> {
    return this.historyStack.entries();
  }

  snapshot(): FrozenContextSnapshot {
    return this.store.freeze({
      flowId: this.currentFlowId,
      endedAt: Date.now(),
    });
  }

  /**
   * Bridge-friendly: set a value by string name. Used by native wrappers that
   * cannot construct a `ContextKey` object directly.
   */
  setByName(name: string, description: string, value: unknown): void {
    this.set(this.ensureNamedKey(name, description), value);
  }

  /** Bridge-friendly: get a value by string name. */
  getByName(name: string): unknown {
    return this.get(this.ensureNamedKey(name));
  }

  /** Bridge-friendly: check presence by string name. */
  hasByName(name: string): boolean {
    return this.has(this.ensureNamedKey(name));
  }

  /** Bridge-friendly: subscribe by string name. */
  subscribeByName(
    name: string,
    description: string,
    handler: (value: unknown, name: string) => void,
  ): SubscriptionToken {
    return this.subscribe(this.ensureNamedKey(name, description), (value) =>
      handler(value, name),
    );
  }

  /**
   * Bridge-friendly: subscribe to all updates. The handler receives the
   * key's resolved name (or undefined for non-namespaced keys).
   */
  subscribeAllByName(
    handler: (
      value: unknown,
      name: string | undefined,
      description: string,
    ) => void,
  ): SubscriptionToken {
    return this.subscribeAll((value, key) =>
      handler(value, nameOfContextKey(key), key.description),
    );
  }

  private ensureNamedKey(
    name: string,
    description?: string,
  ): ContextKey<unknown> {
    return defineContextKey<unknown>(name, description ?? name);
  }

  private notify<Value>(key: ContextKey<Value>, value: Value | undefined) {
    this.hooks.onSet.call(key, value);
    const bucket = this.perKeySubs.get(key.symbol);
    if (bucket) {
      for (const handler of bucket.values()) {
        (handler as ContextSubscriber<Value>)(value, key);
      }
    }
    for (const handler of this.globalSubs.values()) {
      handler(value, key);
    }
  }

  private rotateStore() {
    this.store = new ContextStore();
    for (const { key, transform } of this.transforms.values()) {
      this.store.registerTransform(key, transform);
    }
  }

  private nextToken(): SubscriptionToken {
    subscriptionCounter += 1;
    return `ctx_${subscriptionCounter}`;
  }
}
