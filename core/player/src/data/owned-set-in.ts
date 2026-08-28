import { clone } from "timm";

/** True for non-null objects/arrays — mirrors timm's internal `isObject`. */
function isObject(o: any): boolean {
  return o != null && typeof o === "object";
}

function doOwnedSetIn(
  obj: any,
  path: ReadonlyArray<string | number>,
  val: any,
  idx: number,
  owned: WeakSet<object>,
): any {
  let newValue: any;
  const key = path[idx];

  if (idx === path.length - 1) {
    newValue = val;
  } else {
    const nested =
      isObject(obj) && isObject(obj[key])
        ? obj[key]
        : typeof path[idx + 1] === "number"
          ? []
          : {};
    newValue = doOwnedSetIn(nested, path, val, idx + 1, owned);
  }

  const container = obj != null ? obj : typeof key === "number" ? [] : {};

  if (container[key] === newValue) {
    return container;
  }

  // A container cloned earlier under the same `owned` set is ours to mutate.
  if (owned.has(container)) {
    container[key] = newValue;
    return container;
  }

  const cloned = clone(container);
  owned.add(cloned);
  cloned[key] = newValue;
  return cloned;
}

/**
 * A timm-compatible `setIn` that clones each touched container at most once for
 * the lifetime of the provided `owned` set. Containers cloned while applying an
 * earlier path are tracked in `owned`, so a later write through a shared
 * ancestor mutates the existing clone instead of re-cloning it.
 *
 * The original tree is never mutated (the first write to any container always
 * clones), so immutability is preserved for holders of the previous value. With
 * a fresh `owned` set each call this is identical to timm's `setIn`; sharing the
 * set across calls is what avoids the redundant re-clones of shared ancestors.
 *
 * Mirrors timm's `setIn` semantics: intermediate keys are created (arrays for
 * numeric segments), the no-op short-circuit preserves referential equality
 * when nothing changes, and `clone` preserves symbol keys.
 */
export function ownedSetIn(
  obj: any,
  path: ReadonlyArray<string | number>,
  val: any,
  owned: WeakSet<object>,
): any {
  if (path.length === 0) {
    return val;
  }

  return doOwnedSetIn(obj, path, val, 0, owned);
}
