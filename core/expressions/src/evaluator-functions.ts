import type { BindingLike } from '@player-ui/binding';
import type { Binding } from '@player-ui/types';
import type { ExpressionHandler, ExpressionContext } from './types';

/** Sets a value to the data-model */
export const setDataVal: ExpressionHandler<[Binding, any], any> = (
  _context: ExpressionContext,
  binding,
  value
) => {
  _context.model.set([[binding as BindingLike, value]]);
};

/** Fetches a valid from the data-model */
export const getDataVal: ExpressionHandler<[Binding], unknown> = (
  _context: ExpressionContext,
  binding
) => {
  return _context.model.get(binding as BindingLike);
};

/** Deletes a value from the model */
export const deleteDataVal: ExpressionHandler<[Binding], void> = (
  _context: ExpressionContext,
  binding
) => {
  return _context.model.set([[binding as BindingLike, undefined]]);
};
