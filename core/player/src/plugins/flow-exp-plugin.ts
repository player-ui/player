import type {
  Expression,
  ExpressionObject,
  NavigationFlowState,
} from '@player-ui/types';
import type { ExpressionEvaluator } from '@player-ui/expressions';
import type { FlowInstance } from '@player-ui/flow';
import type { Player, PlayerPlugin } from '../player';
import type { InProgressState } from '../types';

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
          expressionEvaluator?.evaluate(exp);
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
            /** Get the current state of Player */
            const currentState = () => player.getState() as InProgressState;

            /** Get the current flow state */
            const currentFlowState =
              currentState().controllers.flow.current?.currentState;

            if (currentFlowState?.value.onEnd) {
              handleEval(currentFlowState.value.onEnd);
            }

            if (nextState?.onStart) {
              handleEval(nextState.onStart);
            }
          },
        });
      });
    });
  }
}
