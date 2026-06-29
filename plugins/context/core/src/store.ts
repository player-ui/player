import type {
  ContextEntryDescriptor,
  ContextKey,
  ContextTransform,
  FrozenContextEntry,
  FrozenContextSnapshot,
} from "./types";
import { nameOfContextKey } from "./key";

type Entry = {
  key: ContextKey;
  hasLiteral: boolean;
  literal?: unknown;
  transform?: ContextTransform<unknown>;
};

const deepFreezeEntry = (entry: FrozenContextEntry): FrozenContextEntry => {
  Object.freeze(entry);
  return entry;
};

/**
 * A poisoned stand-in for a function captured into a history snapshot. The
 * key and description survive in the snapshot — the capability *existed* —
 * but the callable is dead: invoking it throws because the flow it was bound
 * to has ended. This preserves the distinction between "context that never
 * held this action" and "an action that is no longer valid".
 */
const tombstone = (description: string) => (): never => {
  throw new Error(
    `[ContextPlugin] Action "${description}" is no longer valid — its flow has ended`,
  );
};

/**
 * Recursively replace every function in [value] (top-level or nested) with a
 * {@link tombstone}, so a frozen history snapshot carries no live callables.
 */
const tombstoneFunctions = (value: unknown, description: string): unknown => {
  if (typeof value === "function") {
    return tombstone(description);
  }
  if (Array.isArray(value)) {
    return value.map((item) => tombstoneFunctions(item, description));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = tombstoneFunctions(v, description);
    }
    return out;
  }
  return value;
};

/**
 * Mutable per-flow context store. Owned by a single flow lifecycle; the plugin
 * rotates the store on flow end and freezes the prior one into a snapshot.
 */
export class ContextStore {
  private entries = new Map<symbol, Entry>();
  /** source symbol -> set of target symbols (reverse index for invalidation). */
  private dependents = new Map<symbol, Set<symbol>>();

  register(key: ContextKey): boolean {
    if (this.entries.has(key.symbol)) {
      return false;
    }
    this.entries.set(key.symbol, { key, hasLiteral: false });
    return true;
  }

  set<Value>(key: ContextKey<Value>, value: Value): void {
    const existing = this.entries.get(key.symbol);
    if (existing) {
      existing.hasLiteral = true;
      existing.literal = value;
      existing.key = key;
    } else {
      this.entries.set(key.symbol, {
        key,
        hasLiteral: true,
        literal: value,
      });
    }
  }

  registerTransform<Value>(
    key: ContextKey<Value>,
    transform: ContextTransform<Value>,
  ): { previousSources?: ReadonlyArray<ContextKey> } {
    const existing = this.entries.get(key.symbol);
    const previousSources = existing?.transform?.sources;

    if (previousSources) {
      for (const src of previousSources) {
        this.dependents.get(src.symbol)?.delete(key.symbol);
      }
    }

    const stored: ContextTransform<unknown> = {
      sources: transform.sources,
      compute: transform.compute as ContextTransform<unknown>["compute"],
    };

    if (existing) {
      existing.transform = stored;
      existing.key = key;
    } else {
      this.entries.set(key.symbol, {
        key,
        hasLiteral: false,
        transform: stored,
      });
    }

    for (const src of transform.sources) {
      let set = this.dependents.get(src.symbol);
      if (!set) {
        set = new Set();
        this.dependents.set(src.symbol, set);
      }
      set.add(key.symbol);
    }

    return { previousSources };
  }

  get<Value>(key: ContextKey<Value>): Value | undefined {
    return this.compute(key.symbol) as Value | undefined;
  }

  has(key: ContextKey): boolean {
    const entry = this.entries.get(key.symbol);
    return Boolean(entry && (entry.hasLiteral || entry.transform));
  }

  /** Return the keys that depend on the given source key (direct dependents only). */
  dependentsOf(sourceSymbol: symbol): ReadonlyArray<ContextKey> {
    const set = this.dependents.get(sourceSymbol);
    if (!set || set.size === 0) {
      return [];
    }
    const out: ContextKey[] = [];
    for (const targetSymbol of set) {
      const target = this.entries.get(targetSymbol);
      if (target) {
        out.push(target.key);
      }
    }
    return out;
  }

  list(): ReadonlyArray<ContextEntryDescriptor> {
    const out: ContextEntryDescriptor[] = [];
    for (const entry of this.entries.values()) {
      out.push({
        symbol: entry.key.symbol,
        description: entry.key.description,
        hasValue: entry.hasLiteral,
        hasTransform: Boolean(entry.transform),
      });
    }
    return out;
  }

  freeze(meta: { flowId?: string; endedAt: number }): FrozenContextSnapshot {
    const frozenEntries: FrozenContextEntry[] = [];
    for (const entry of this.entries.values()) {
      if (!entry.hasLiteral && !entry.transform) {
        continue;
      }
      const computed = this.compute(entry.key.symbol);
      const value = tombstoneFunctions(computed, entry.key.description);
      frozenEntries.push(
        deepFreezeEntry({
          symbol: entry.key.symbol,
          name: nameOfContextKey(entry.key),
          description: entry.key.description,
          value,
        }),
      );
    }
    const bySymbol = new Map(frozenEntries.map((e) => [e.symbol, e.value]));
    const snapshot: FrozenContextSnapshot = {
      flowId: meta.flowId,
      endedAt: meta.endedAt,
      entries: Object.freeze(frozenEntries),
      get<Value>(key: ContextKey<Value>): Value | undefined {
        return bySymbol.get(key.symbol) as Value | undefined;
      },
    };
    return Object.freeze(snapshot);
  }

  private compute(sym: symbol): unknown {
    const entry = this.entries.get(sym);
    if (!entry) return undefined;
    if (entry.hasLiteral) return entry.literal;
    if (!entry.transform) return undefined;
    const reader = <V>(otherKey: { symbol: symbol }): V | undefined =>
      this.compute(otherKey.symbol) as V | undefined;
    return entry.transform.compute(reader);
  }
}
