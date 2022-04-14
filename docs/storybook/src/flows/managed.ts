import { FlowManager, Flow, CompletedState } from '@player-ui/react';
import { makeFlow } from '@player-ui/make-flow';

const firstFlow = makeFlow({
  id: 'text-1',
  type: 'action',
  value: 'Flow 1',
  label: {
    asset: { id: 'action-label-1', type: 'text', value: 'End Flow 1' },
  },
});

const secondFlow = makeFlow({
  id: 'text-2',
  type: 'action',
  value: 'Flow 2',
  label: {
    asset: { id: 'action-label-2', type: 'text', value: 'End Flow 2' },
  },
});

const errorFlow = makeFlow({
  id: 'text-2',
  type: 'action',
  value: 'Flow Error',
  exp: '{{foo.bar..}',
  label: {
    asset: { id: 'action-label-2', type: 'text', value: 'End Flow 2' },
  },
});

const assetErrorFlow = makeFlow({
  id: 'text-3',
  type: 'error',
});

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
