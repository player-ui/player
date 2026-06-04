import get from "dlv";
import { setIn, omit, removeAt } from "timm";
import type { BindingInstance } from "../binding";
import type { BatchSetTransaction, DataModelImpl, Updates } from "./model";
import { ownedSetIn } from "./owned-set-in";

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
      model = ownedSetIn(model, path, value, owned);
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
