import type {
  Player,
  PlayerPlugin,
  ExpressionHandler,
} from "@player-ui/player";

export type ExpressionMap = Map<string, ExpressionHandler<any[], any>>;

/**
 * The ExpressionPlugin is an easy way to inject custom expression handlers into the running player instance.
 * Simply supply a map of function name to handler, and the expressions will be available inside of the Content.
 *
 * Any subsequent expressions registered with the same name will override previous handlers.
 */
export class ExpressionPlugin implements PlayerPlugin {
  name = "ExpressionPlugin";
  private expressions: ExpressionMap;

  constructor(expressionMap: ExpressionMap) {
    this.expressions = expressionMap;
  }

  apply(player: Player) {
    player.hooks.expressionEvaluator.tap(this.name, (expEvaluator) => {
      this.expressions.forEach((handler, name) => {
        expEvaluator.addExpressionFunction(name, handler);
      });
    });
  }
}
