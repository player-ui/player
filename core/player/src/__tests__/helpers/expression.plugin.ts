import type { Player, PlayerPlugin } from '../../player';
import type { Binding, ExpressionHandler } from '../..';

/**
 * Adds a validation provider to the validator registry
 *
 * @param vc - validation controller
 */
export const sumFunction: ExpressionHandler<
  [Binding | unknown, string | string[]],
  number
> = (ctx, modelOrReference, propName) => {
  const values = Array.isArray(modelOrReference)
    ? modelOrReference
    : [modelOrReference];

  let total = 0;
  values.forEach((value) => {
    total += ctx.model.get(value);
  });

  return total;
};

/** A plugin that tracks bindings and attaches validations to anything w/ a binding property */
export default class TestExpressionPlugin implements PlayerPlugin {
  name = 'expressions';

  apply(player: Player) {
    player.hooks.expressionEvaluator.tap(this.name, (expressionEvaluator) => {
      expressionEvaluator.addExpressionFunction('sumValues', sumFunction);
    });
  }
}
