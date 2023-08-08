import get from 'dlv';
import { setIn, omit, removeAt } from 'timm';
import type { BindingInstance } from '../binding';
import type { BatchSetTransaction, DataModelImpl, Updates } from './model';

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
    transaction.forEach(([binding, value]) => {
      const oldValue = this.get(binding);
      this.model = setIn(this.model, binding.asArray(), value) as any;
      effectiveOperations.push({ binding, oldValue, newValue: value });
    });
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
            removeAt(parentValue, binding.key() as number)
          ) as any;
        } else {
          this.model = setIn(
            this.model,
            parentBinding.asArray(),
            omit(parentValue, binding.key() as string)
          ) as any;
        }
      }
    }
  }
}
