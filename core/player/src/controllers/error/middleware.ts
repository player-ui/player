import type { BindingInstance } from "../../binding";
import type {
  BatchSetTransaction,
  DataModelImpl,
  DataModelMiddleware,
  DataModelOptions,
  Updates,
} from "../../data";
import type { Logger } from "../../logger";

/**
 * Middleware that prevents external writes to errorState
 * Only authorized callers (with the auth symbol) can write to this path
 */
export class ErrorStateMiddleware implements DataModelMiddleware {
  name = "error-state-middleware";

  private logger?: Logger;
  private authSymbol: symbol;

  constructor(options: { logger?: Logger; authSymbol: symbol }) {
    this.logger = options.logger;
    this.authSymbol = options.authSymbol;
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): Updates {
    // Check if this write is authorized by comparing the auth tokens
    if (options?.authToken === this.authSymbol) {
      return next?.set(transaction, options) ?? [];
    }

    // Filter out any writes to errorState
    const filteredTransaction: BatchSetTransaction = [];
    const blockedBindings: BindingInstance[] = [];

    transaction.forEach(([binding, value]) => {
      const path = binding.asString();

      // Block writes to errorState namespace
      if (path === "errorState" || path.startsWith("errorState.")) {
        blockedBindings.push(binding);
        this.logger?.warn(
          `[ErrorStateMiddleware] Blocked write to protected path: ${path}`,
        );
      } else {
        filteredTransaction.push([binding, value]);
      }
    });

    // Process allowed writes
    const validResults = next?.set(filteredTransaction, options) ?? [];

    // Return no-op updates for blocked paths
    const blockedResults: Updates = blockedBindings.map((binding) => ({
      binding,
      oldValue: next?.get(binding, options),
      newValue: next?.get(binding, options), // Keep old value
      force: false,
    }));

    return [...validResults, ...blockedResults];
  }

  public get(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): unknown {
    return next?.get(binding, options);
  }

  public delete(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): void {
    // Check if this delete is authorized by comparing the auth tokens
    if (options?.authToken === this.authSymbol) {
      next?.delete(binding, options);
      return;
    }

    const path = binding.asString();

    // Block deletes to errorState namespace
    if (path === "errorState" || path.startsWith("errorState.")) {
      this.logger?.warn(
        `[ErrorStateMiddleware] Blocked delete of protected path: ${path}`,
      );
      return;
    }

    next?.delete(binding, options);
  }
}
