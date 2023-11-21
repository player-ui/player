import type { ExpressionHandler, ExpressionType } from '../expressions';
import type { SchemaController } from '../schema';
import type { Player, PlayerPlugin } from '../player';

/** Gets formatter for given formatName and formats value if found, returns value otherwise */
const createFormatFunction = (schema: SchemaController) => {
  /**
   * The generated handler for the given schema
   */
  const handler: ExpressionHandler<[unknown, string], any> = (
    ctx,
    value,
    formatName,
  ) => {
    return (
      schema.getFormatterForType({ type: formatName })?.format(value) ?? value
    );
  };

  return handler;
};

/**
 * A plugin that provides the out-of-the-box expressions for player
 */
export class DefaultExpPlugin implements PlayerPlugin {
  name = 'flow-exp-plugin';

  apply(player: Player) {
    let formatFunction: ExpressionHandler<[unknown, string]> | undefined;

    player.hooks.schema.tap(this.name, (schemaController) => {
      formatFunction = createFormatFunction(schemaController);
    });

    player.hooks.expressionEvaluator.tap(this.name, (expEvaluator) => {
      if (formatFunction) {
        expEvaluator.addExpressionFunction('format', formatFunction);
      }

      expEvaluator.addExpressionFunction('log', (ctx, ...args) => {
        player.logger.info(...args);
      });

      expEvaluator.addExpressionFunction('debug', (ctx, ...args) => {
        player.logger.debug(...args);
      });

      expEvaluator.addExpressionFunction(
        'eval',
        (ctx, ...args: [ExpressionType]) => {
          return ctx.evaluate(...args);
        },
      );
    });
  }
}
