import { FlowManager, Flow, CompletedState } from '@player-ui/react';
import { makeFlow } from '@player-ui/make-flow';
import firstFlow from '@player-ui/reference-assets-plugin-mocks/flow-manager/first-flow.json';
import secondFlow from '@player-ui/reference-assets-plugin-mocks/flow-manager/second-flow.json';
import errorFlow from '@player-ui/reference-assets-plugin-mocks/flow-manager/error-flow.json';
import assetErrorFlow from '@player-ui/reference-assets-plugin-mocks/flow-manager/asset-error-flow.json';

export const SIMPLE_FLOWS = [firstFlow, secondFlow];
export const ERROR_CONTENT_FLOW = [firstFlow, errorFlow];
export const ERROR_ASSET_FLOW = [firstFlow, assetErrorFlow];

export function createFlowManager(flowSequence: Array<Flow>) {
  const dummyManager: FlowManager = {
    async next(prevState?: CompletedState) {
      if (!prevState) {
        return { value: flowSequence[0] };
      }

      const flowIndex = flowSequence.indexOf(prevState.flow);

      if (flowIndex >= flowSequence.length - 1) {
        return { done: true };
      }

      return { value: flowSequence[flowIndex + 1] };
    },
  };
  return dummyManager;
}
