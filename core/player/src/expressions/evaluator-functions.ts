import type { Binding } from '@player-ui/types';

import type { BindingLike } from '../binding';
import type {
  ExpressionHandler,
  ExpressionContext,
  ExpressionNode,
} from './types';

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
  const resolution = ctx.evaluate(condition);
  if (resolution) {
    return ctx.evaluate(ifTrue);
  }

  if (ifFalse) {
    return ctx.evaluate(ifFalse);
  }

  return null;
};

conditional.resolveParams = false;
