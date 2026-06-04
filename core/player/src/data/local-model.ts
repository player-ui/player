import get from "dlv";
import { setIn, omit, removeAt, clone } from "timm";
import type { BindingInstance } from "../binding";
import type { BatchSetTransaction, DataModelImpl, Updates } from "./model";

/** True for non-null objects/arrays — mirrors timm's internal `isObject`. */
function isObject(o: any): boolean {
  return o != null && typeof o === "object";
}

/**
 * Sets `path` to `val` within `obj`, mirroring timm's `setIn` (intermediate
 * key creation, no-op short-circuit, symbol-preserving clone) but cloning each
 * touched container at most once per batch.
 *
 * Containers cloned during the current batch are tracked in `owned`, so a later
 * update passing through the same ancestor (e.g. sibling writes under a shared
 * parent) mutates the existing clone instead of re-cloning it. The original
 * tree is never mutated, preserving immutability for holders of the old model.
 */
function batchSetIn(
  obj: any,
  path: Array<string | number>,
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
    newValue = batchSetIn(nested, path, val, idx + 1, owned);
  }

  const container = obj != null ? obj : typeof key === "number" ? [] : {};

  if (container[key] === newValue) {
    return container;
  }

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
 * A data model that stores data in an in-memory JS object
 */
export class LocalModel implements DataModelImpl {
  public model: {
    [key: string]: any;
  };

  constructor(model = {}) {
    this.model = model;
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
  }

  public reset(model = {}) {
    this.model = model;
  }

  public get(binding?: BindingInstance) {
    if (!binding || !binding.asString()) {
      return this.model;
    }

    return get(this.model, binding.asArray() as string[]);
  }

  public set(transaction: BatchSetTransaction) {
    const effectiveOperations: Updates = [];

    // Single-entry sets are by far the most common; use timm's setIn directly
    // to skip the per-batch bookkeeping that only pays off across multiple
    // updates sharing ancestors.
    if (transaction.length === 1) {
      const binding = transaction[0][0];
      const value = transaction[0][1];
      const path = binding.asArray() as string[];
      const oldValue = get(this.model, path);
      this.model = setIn(this.model, path, value) as any;
      effectiveOperations.push({ binding, oldValue, newValue: value });
      return effectiveOperations;
    }

    // Containers cloned during this batch, so shared ancestors are copied once.
    const owned = new WeakSet<object>();
    let model = this.model;

    for (let i = 0; i < transaction.length; i++) {
      const binding = transaction[i][0];
      const value = transaction[i][1];
      const path = binding.asArray() as string[];
      const oldValue = get(model, path);
      model =
        path.length === 0 ? value : batchSetIn(model, path, value, 0, owned);
      effectiveOperations.push({ binding, oldValue, newValue: value });
    }

    this.model = model;
    return effectiveOperations;
  }

  public delete(binding: BindingInstance) {
    const parentBinding = binding.parent();

    if (parentBinding) {
      const parentValue = this.get(parentBinding);

      if (parentValue !== undefined) {
        if (Array.isArray(parentValue)) {
          this.model = setIn(
            this.model,
            parentBinding.asArray(),
            removeAt(parentValue, binding.key() as number),
          ) as any;
        } else {
          this.model = setIn(
            this.model,
            parentBinding.asArray(),
            omit(parentValue, binding.key() as string),
          ) as any;
        }
      }
    }
  }
}
