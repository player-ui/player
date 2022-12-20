import { setIn } from 'timm';
import type { BindingInstance } from '../binding';
import type {
  BatchSetTransaction,
  DataModelImpl,
  DataModelOptions,
  DataModelMiddleware,
  Updates,
} from '../data';
import { toModel } from '../data';
import type { Logger } from '../logger';

import type { ValidationResponse } from './types';

/**
 * A BindingInstance with an indicator of whether or not it's a strong binding
 */
export type StrongOrWeakBinding = {
  /** BindingInstance in question */
  binding: BindingInstance;
  /** Boolean indicating whether the relevant BindingInstance is a strong binding */
  isStrong: boolean;
};

/**
 * Returns a validation object if the data is invalid or an set of BindingsInstances if the binding itself is a weak ref of another invalid validation
 */
export type MiddlewareChecker = (
  binding: BindingInstance,
  model: DataModelImpl
) => ValidationResponse | Set<StrongOrWeakBinding> | undefined;

/**
 * Middleware for the data-model that caches the results of invalid data
 */
export class ValidationMiddleware implements DataModelMiddleware {
  public validator: MiddlewareChecker;
  public shadowModelPaths: Map<BindingInstance, any>;
  private logger?: Logger;

  constructor(
    validator: MiddlewareChecker,
    options?: {
      /** A logger instance */
      logger?: Logger;
    }
  ) {
    this.validator = validator;
    this.shadowModelPaths = new Map();
    this.logger = options?.logger;
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl
  ): Updates {
    const asModel = toModel(this, { ...options, includeInvalid: true }, next);
    const nextTransaction: BatchSetTransaction = [];

    transaction.forEach(([binding, value]) => {
      this.shadowModelPaths.set(binding, value);
    });

    const invalidBindings: Array<BindingInstance> = [];

    this.shadowModelPaths.forEach((value, binding) => {
      const validations = this.validator(binding, asModel);

      if (validations === undefined) {
        nextTransaction.push([binding, value]);
      } else if (validations instanceof Set) {
        validations.forEach((validation) => {
          invalidBindings.push(validation.binding);
          if (!validation.isStrong) {
            nextTransaction.push([validation.binding, value]);
          }
        });
      } else {
        this.logger?.debug(
          `Invalid value for path: ${binding.asString()} - ${
            validations.severity
          } - ${validations.message}`
        );
      }
    });

    if (next && nextTransaction.length > 0) {
      // defer clearing the shadow model to prevent validations that are run twice due to weak binding refs still needing the data
      nextTransaction.forEach(([binding]) =>
        this.shadowModelPaths.delete(binding)
      );
      const result = next.set(nextTransaction, options);
      if (invalidBindings.length === 0) {
        return result;
      }
    }

    return invalidBindings.map((binding) => {
      return {
        binding,
        oldValue: asModel.get(binding),
        newValue: asModel.get(binding),
        force: true,
      };
    });
  }

  public get(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl
  ) {
    let val = next?.get(binding, options);

    if (options?.includeInvalid === true) {
      this.shadowModelPaths.forEach((shadowValue, shadowBinding) => {
        if (shadowBinding === binding) {
          val = shadowValue;

          return;
        }

        if (binding.contains(shadowBinding)) {
          val = setIn(val, shadowBinding.relative(binding), shadowValue);
        }
      });
    }

    return val;
  }
}
