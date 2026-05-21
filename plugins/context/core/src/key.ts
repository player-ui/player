import type { ContextKey } from "./types";

const KEY_NAMESPACE = "player-ui.context.";

/**
 * Create a typed, globally-identifiable context key.
 *
 * Identity is backed by `Symbol.for`, so two keys created with the same `name`
 * in different bundles refer to the same store entry. The `description` is the
 * human-readable label used by introspection consumers.
 */
export const defineContextKey = <Value>(
  name: string,
  description: string,
): ContextKey<Value> => ({
  symbol: Symbol.for(`${KEY_NAMESPACE}${name}`),
  description,
});

/**
 * Resolve the global symbol for a context key name. Used by native wrappers
 * that cross the JS bridge with string names instead of JS symbols.
 */
export const resolveContextKeySymbol = (name: string): symbol =>
  Symbol.for(`${KEY_NAMESPACE}${name}`);

/**
 * Reverse-derive the name from a key created via `defineContextKey`. Returns
 * `undefined` if the key's symbol was not created in the context namespace.
 */
export const nameOfContextKey = (key: ContextKey): string | undefined => {
  const k = Symbol.keyFor(key.symbol);
  if (!k || !k.startsWith(KEY_NAMESPACE)) return undefined;
  return k.slice(KEY_NAMESPACE.length);
};
