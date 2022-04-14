import SortedArray from 'sorted-array';
import type { Matcher } from './deep-partial-matcher';
import createObjectMatcher from './deep-partial-matcher';

export { default as createObjectMatcher } from './deep-partial-matcher';

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

/** create an empty sorted array using the matcher count */
const createSortedArray = <V>() =>
  new SortedArray<RegistryIndex<V>>([], (c) => c.matcher.count);

/**
 * A partial match registry is a map that uses an object to "match" against keys.
 * More specific matches take precedence over less specific ones.
 */
export class Registry<V> {
  private store = createSortedArray<V>();

  constructor(initialSet?: Array<[any, V]>) {
    initialSet?.forEach(([match, value]) => {
      this.set(match, value);
    });
  }

  /** Add match -> value mapping to the registry */
  set(match: any, value: V) {
    const matcher =
      typeof match === 'object'
        ? createObjectMatcher(match)
        : createBasicMatcher(match);

    this.store.insert({
      key: match,
      value,
      matcher,
    });
  }

  /** Fetch the best match in the registry */
  get(query: any): V | undefined {
    for (const entry of this.store.array) {
      if (entry.matcher(query)) {
        return entry.value;
      }
    }
  }

  /** Loop over all entries and run callback */
  forEach(callbackfn: (value: RegistryIndex<V>) => void): void {
    for (const entry of this.store.array) {
      callbackfn(entry);
    }
  }

  /** Reset the items in the registry */
  clear() {
    this.store = createSortedArray<V>();
  }
}
