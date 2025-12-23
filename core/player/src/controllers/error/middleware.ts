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
 * Only ErrorController should write to this path
 */
export class ErrorStateMiddleware implements DataModelMiddleware {
  name = "error-state-middleware";

  private logger?: Logger;
  private allowWrites = false;

  constructor(options?: { logger?: Logger }) {
    this.logger = options?.logger;
  }

  /**
   * Allow ErrorController to temporarily bypass protection
   */
  public enableWrites(): void {
    this.allowWrites = true;
  }

  /**
   * Re-enable protection after ErrorController write
   */
  public disableWrites(): void {
    this.allowWrites = false;
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl,
  ): Updates {
    // If writes are allowed (from ErrorController), pass through
    if (this.allowWrites) {
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
  ): boolean {
    // If writes are allowed (from ErrorController), pass through
    if (this.allowWrites) {
      return next?.delete(binding, options) ?? false;
    }

    const path = binding.asString();

    // Block deletes to errorState namespace
    if (path === "errorState" || path.startsWith("errorState.")) {
      this.logger?.warn(
        `[ErrorStateMiddleware] Blocked delete of protected path: ${path}`,
      );
      return false;
    }

    return next?.delete(binding, options) ?? false;
  }
}
