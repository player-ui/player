import type {
  Player,
  PlayerPlugin,
  ExpressionEvaluator,
  Schema,
  Expression,
  DataModelMiddleware,
  Updates,
  SchemaController,
  BindingInstance,
} from '@player-ui/player';

export interface ExpressionDataType extends Schema.DataType<'Expression'> {
  /** The expression to evaluate to compute the value of this node */
  exp?: Expression;
}

/**
 * A player plugin to manage beacon events.
 * It automatically keeps track of the current user's view, and adds additional metaData to each beacon event.
 */
export class ComputedPropertiesPlugin implements PlayerPlugin {
  name = 'ComputedProperties';

  apply(player: Player) {
    // Inject a middleware into the data-model to intercept any calls to an expression type in the schema
    // Calls to `set` throw an error. Calls to `get` compute the value and return if or default

    let schemaController: SchemaController | undefined;
    let expressionEvaluator: ExpressionEvaluator | undefined;

    /** Look up the data-type of the binding, and check for an Expression type */
    const getExpressionType = (
      binding: BindingInstance
    ): ExpressionDataType | undefined => {
      // Check to see if the data-type of the binding is an `Expression`
      const dataType = schemaController?.getType(binding);

      if (dataType?.type === 'Expression') {
        return dataType as ExpressionDataType;
      }
    };

    const computedPropertyMiddleware: DataModelMiddleware = {
      name: this.name,
      get(binding, options, next) {
        const expType = getExpressionType(binding);

        if (expType) {
          const { exp } = expType;
          const result =
            exp && expressionEvaluator?.evaluate(exp, options?.context);

          return result ?? expType.default;
        }

        return next?.get(binding, options);
      },
      set(transaction, options, next): Updates {
        for (const setOperation of transaction) {
          if (getExpressionType(setOperation[0])) {
            throw new Error(
              `Invalid 'set' operation on computed property: ${setOperation[0].asString()}`
            );
          }
        }

        return next?.set(transaction, options) ?? [];
      },
      delete(binding, options, next) {
        if (getExpressionType(binding)) {
          throw new Error(
            `Invalid 'delete' operation on computed property: ${binding.asString()}`
          );
        }

        return next?.delete(binding, options);
      },
    };

    player.hooks.dataController.tap(this.name, (dataController) => {
      dataController.hooks.resolveDataStages.tap(this.name, (dataPipeline) => {
        return [...dataPipeline, computedPropertyMiddleware];
      });
    });

    player.hooks.schema.tap(this.name, (schema) => {
      schemaController = schema;
    });

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      expressionEvaluator = evaluator;
    });
  }
}
