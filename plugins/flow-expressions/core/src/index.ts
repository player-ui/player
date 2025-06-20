import type {
  Player,
  PlayerPlugin,
  ExpressionHandler,
  Flow,
} from "@player-ui/player";

export type LocalExpressionMap = Map<string, ExpressionHandler<any[], any>>;

/**
 * The FlowExpressionsPlugin makes flow-level expressions available as operators in the expression evaluator.
 * This allows expressions defined in the flow to be used directly in the expression evaluator.
 */
export class FlowExpressionsPlugin implements PlayerPlugin {
  name = "FlowExpressionsPlugin";

  apply(player: Player): void {
    let expressions: any = {};

    player.hooks.resolveFlowContent.intercept({
      name: this.name,
      result: (flow: Flow) => {
        expressions = flow.expressions;
      },
    });

    // Make the expressions available to the expression evaluator
    player.hooks.expressionEvaluator.tap(this.name, (expEvaluator) => {
      Object.entries(expressions as any).forEach(([name, expression]) => {
        expEvaluator.operators.expressions.set(name, (ctx, args) => {
          return ctx.evaluate(expression as any);
        });
      });
    });
  }
}
