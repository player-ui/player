import type {
  Expression,
  ExpressionObject,
  NavigationFlowState,
} from '@player-ui/types';
import type { ExpressionEvaluator, ExpressionType } from '../expressions';
import type { FlowInstance } from '../controllers';
import type { Player, PlayerPlugin } from '../player';

/**
 * A plugin that taps into the flow controller to evaluate available expressions
 * Expressions can be exposed via lifecycle "hooks" in flow/state nodes
 * e.g: onStart, onEnd
 */
export class FlowExpPlugin implements PlayerPlugin {
  name = 'flow-exp-plugin';

  apply(player: Player) {
    let expressionEvaluator: ExpressionEvaluator | undefined;

    /**
     * Eval Helper
     *
     * @param exp - an expression to be evaluated
     */
    const handleEval = (exp: Expression | ExpressionObject) => {
      if (exp) {
        if (typeof exp === 'object' && 'exp' in exp) {
          expressionEvaluator?.evaluate(exp.exp);
        } else {
          expressionEvaluator?.evaluate(exp as ExpressionType);
        }
      }
    };

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      expressionEvaluator = evaluator;
    });

    player.hooks.flowController.tap(this.name, (fc) => {
      fc.hooks.flow.tap(this.name, (flow: FlowInstance) => {
        // Eval flow nodes
        flow.hooks.onStart.tap(this.name, (exp) => handleEval(exp));

        flow.hooks.onEnd.tap(this.name, (exp) => handleEval(exp));
        // Eval state nodes
        flow.hooks.resolveTransitionNode.intercept({
          call: (nextState: NavigationFlowState) => {
            if (nextState?.onStart) {
              handleEval(nextState.onStart);
            }
          },
        });
      });
    });
  }
}
