import { sort } from "fast-sort";
import type { Matcher } from "./deep-partial-matcher";
import { createObjectMatcher } from "./deep-partial-matcher";

export { createObjectMatcher } from "./deep-partial-matcher";

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
 */
export class Registry<V> {
  private store: Array<RegistryIndex<V>> = [];

  constructor(initialSet?: Array<[any, V]>) {
    initialSet?.forEach(([match, value]) => {
      this.set(match, value);
    });
  }

  /** Add match -> value mapping to the registry */
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
    }

    this.store.push({
      key: match,
      value,
      matcher,
    });

    // Sort in descending order by matcher.count (highest specificity first)
    this.store = sort(this.store).desc((entry) => entry.matcher.count);
  }

  /** Fetch the best match in the registry */
  get(query: any): V | undefined {
    // Store is sorted by matcher.count (descending), so iterate forward
    for (const entry of this.store) {
      if (entry.matcher(query)) {
        return entry.value;
      }
    }
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
