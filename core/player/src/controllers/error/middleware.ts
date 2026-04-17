import type { BindingInstance } from "../../binding";
import {
  BatchSetTransaction,
  DataModelImpl,
  DataModelMiddleware,
  DataModelOptions,
  LocalModel,
  Updates,
} from "../../data";
import type { Logger } from "../../logger";

/** Top-level key for all error information. */
export const ERROR_BINDING_PREFIX = "errorState";

const isErrorBinding = (binding: BindingInstance): boolean =>
  binding.asArray()[0] === ERROR_BINDING_PREFIX;

/**
 * Middleware that prevents external writes to errorState
 * Only authorized callers (with the write symbol) can write to this path
 */
export class ErrorStateMiddleware implements DataModelMiddleware {
  name = "error-state-middleware";

  private logger?: Logger;
  private writeSymbol: symbol;
  // Internal model for error state to avoid data serialization
  private dataModel: LocalModel = new LocalModel();

  constructor(options: { logger?: Logger; writeSymbol: symbol }) {
    this.logger = options.logger;
    this.writeSymbol = options.writeSymbol;
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): Updates {
    // Filter out any writes to errorState
    const filteredTransaction: BatchSetTransaction = [];
    const errorTransaction: BatchSetTransaction = [];

    transaction.forEach((transaction) => {
      const [binding] = transaction;
      const targetArray = isErrorBinding(binding)
        ? errorTransaction
        : filteredTransaction;

      targetArray.push(transaction);
    });

    // Process allowed writes
    const nonErrorResults = next?.set(filteredTransaction, options) ?? [];

    const errorResults =
      options?.writeSymbol === this.writeSymbol
        ? this.dataModel.set(errorTransaction)
        : errorTransaction.map((transaction) => {
            const [binding] = transaction;
            this.logger?.warn(
              `[ErrorStateMiddleware] Blocked write to protected path: ${binding.asString()}`,
            );

            const oldValue = next?.get(binding, options);
            return {
              binding,
              oldValue,
              newValue: oldValue, // Keep old value
              force: false,
            };
          });

    return [...nonErrorResults, ...errorResults];
  }

  public get(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): unknown {
    return isErrorBinding(binding)
      ? this.dataModel.get(binding)
      : next?.get(binding, options);
  }

  public delete(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): void {
    if (!isErrorBinding(binding)) {
      next?.delete(binding, options);
      return;
    }
    // Block deletes to errorState namespace
    if (options?.writeSymbol !== this.writeSymbol) {
      this.logger?.warn(
        `[ErrorStateMiddleware] Blocked delete of protected path: ${binding.asString()}`,
      );
      return;
    }

    this.dataModel.delete(binding);
  }
}
