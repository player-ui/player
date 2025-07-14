import type { Binding } from "@player-ui/types";

import type { BindingLike } from "../binding";
import type {
  ExpressionHandler,
  ExpressionContext,
  ExpressionNode,
} from "./types";
import { Awaitable, isAwaitable, makeAwaitable } from "./async";

/** Sets a value to the data-model */
export const setDataVal: ExpressionHandler<[Binding, any], any> = (
  _context: ExpressionContext,
  binding,
  value,
) => {
  _context.model.set([[binding as BindingLike, value]]);
};

/** Fetches a valid from the data-model */
export const getDataVal: ExpressionHandler<[Binding], unknown> = (
  _context: ExpressionContext,
  binding,
) => {
  return _context.model.get(binding as BindingLike);
};

/** Deletes a value from the model */
export const deleteDataVal: ExpressionHandler<[Binding], void> = (
  _context: ExpressionContext,
  binding,
) => {
  return _context.model.delete(binding);
};

/** Conditional expression handler */
export const conditional: ExpressionHandler<
  [ExpressionNode, ExpressionNode, ExpressionNode?]
> = (ctx, condition, ifTrue, ifFalse) => {
  const testResult = ctx.evaluate(condition);

  // Handle Promise case automatically (same pattern as ternary operator)
  if (isAwaitable(testResult)) {
    return testResult.awaitableThen((resolvedTest: any) => {
      if (resolvedTest) {
        return ctx.evaluate(ifTrue);
      }
      if (ifFalse) {
        return ctx.evaluate(ifFalse);
      }
      return null;
    });
  }

  // Handle sync case
  if (testResult) {
    return ctx.evaluate(ifTrue);
  }
  if (ifFalse) {
    return ctx.evaluate(ifFalse);
  }
  return null;
};

conditional.resolveParams = false;

/**
 * Internal await function
 * This is technically registered as `await` but can't be called that due to conflicting with the keyword
 */
export const waitFor: ExpressionHandler<[Promise<any>], Awaitable<any>> = (
  ctx,
  promise,
) => {
  return makeAwaitable(promise);
};
