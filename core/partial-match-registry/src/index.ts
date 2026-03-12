import { sort } from "fast-sort";
import type { Matcher } from "./deep-partial-matcher";
import { createObjectMatcher } from "./deep-partial-matcher";

export { createObjectMatcher } from "./deep-partial-matcher";

/** Minimal logger interface for registry operations */
interface Logger {
  debug?: (...args: Array<any>) => void;
}

/** create a matcher function that matches exactly */
function createBasicMatcher(seed: any): Matcher {
  /** a simple matcher function that only matches itself */
  const matcher = (match: any) => seed === match;
  matcher.count = 1;

  return matcher;
}

interface RegistryIndex<V> {
  /** The original object we wanted to match on  */
  key: object;

  /** The value to return */
  value: V;

  /** The matcher function for this entry */
  matcher: Matcher;
}

/**
 * A partial match registry is a map that uses an object to "match" against keys.
 * More specific matches take precedence over less specific ones.
 *
 * @param V - The type of values stored in the registry
 */
export class Registry<V> {
  private store: Array<RegistryIndex<V>> = [];
  private logger?: Logger;

  /**
   * Creates a new Registry instance
   *
   * @param initialSet - Optional array of [key, value] tuples to populate the registry
   * @param logger - Optional logger instance for debug logging (e.g., when entries are replaced)
   */
  constructor(initialSet?: Array<[any, V]>, logger?: Logger | undefined) {
    initialSet?.forEach(([match, value]) => {
      this.set(match, value);
    });
    this.logger = logger;
  }

  /**
   * Add match -> value mapping to the registry
   *
   * If an entry with the same specificity and matching key already exists, it will be replaced
   * and a debug log will be emitted (if a logger is configured).
   *
   * @param match - The key to match against (can be a primitive or object)
   * @param value - The value to associate with this key
   */
  set(match: any, value: V): void {
    const matcher =
      typeof match === "object"
        ? createObjectMatcher(match)
        : createBasicMatcher(match);

    // Find and remove any existing entry that matches this key
    // Use matcher to check for matching keys (handles deep equality)
    const existingIndex = this.store.findIndex(
      (entry) => entry.matcher(match) && matcher(entry.key),
    );
    if (existingIndex !== -1) {
      this.store.splice(existingIndex, 1);
      this.logger?.debug?.(
        "Registry: Replacing existing entry for key ",
        match,
      );
    }

    this.store.push({
      key: match,
      value,
      matcher,
    });

    // Sort in descending order by matcher.count (highest specificity first)
    this.store = sort(this.store).desc((entry) => entry.matcher.count);
  }

  /**
   * Fetch the best match in the registry
   *
   * Searches for the most specific entry that matches the given query.
   * The registry is sorted by specificity (matcher.count) in descending order,
   * so we iterate forward to find the highest specificity match first.
   *
   * @param query - The query object to match against registered keys
   * @returns The value associated with the best matching key, or undefined if no match found
   */
  get(query: any): V | undefined {
    // Store is sorted by matcher.count (descending), so iterate forward
    for (const entry of this.store) {
      if (entry && entry.matcher(query)) {
        return entry.value;
      }
    }
    return undefined;
  }

  /** Loop over all entries and run callback */
  forEach(callbackfn: (value: RegistryIndex<V>) => void): void {
    for (const entry of this.store) {
      callbackfn(entry);
    }
  }

  /** Reset the items in the registry */
  clear(): void {
    this.store = [];
  }

  /** Check if the registry is empty*/
  isRegistryEmpty(): boolean {
    return this.store.length === 0;
  }
}
