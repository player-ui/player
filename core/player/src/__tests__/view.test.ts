import type { FlowController } from '@player-ui/flow';
import { waitFor } from '@testing-library/react';
import type { Flow, NavigationFlowViewState } from '@player-ui/types';
import TrackBindingPlugin from './helpers/binding.plugin';
import type { InProgressState } from '../types';
import { Player } from '..';
import { ActionExpPlugin } from './helpers/action-exp.test';

const minimal: Flow = {
  id: 'minimal-flow',
  views: [
    {
      id: 'view-1',
      type: 'view',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked {{count}} times',
        },
      },
    },
    {
      id: 'action',
      type: 'action',
      exp: '{{count}} = {{count}} + 1',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked {{count}} times',
        },
      },
    },
  ],
  data: {
    count: 0,
  },
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'view-1',
        transitions: {
          Next: 'VIEW_2',
        },
      },
      VIEW_2: {
        state_type: 'VIEW',
        onStart: '{{count}} = {{count}} + 1',
        ref: 'action',
        transitions: {
          '*': 'END_Done',
        },
      },
      END: {
        state_type: 'END',
        outcome: 'done',
      },
    },
  },
};

describe('state node expression tests', () => {
  let player: Player;
  let flowController: FlowController | undefined;

  beforeEach(() => {
    player = new Player({
      plugins: [new ActionExpPlugin()],
    });
    player.hooks.flowController.tap('test', (fc) => {
      flowController = fc;
    });
  });

  // helpers
  const state = () => player.getState() as InProgressState;
  const getView = () => state().controllers.view.currentView?.lastUpdate;

  test('evaluates onStart expression', async () => {
    player.start(minimal as any);

    expect(getView()).toStrictEqual({
      id: 'view-1',
      type: 'view',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 0 times',
        },
      },
    });

    flowController?.transition('Next');

    expect(getView()).toStrictEqual({
      id: 'action',
      type: 'action',
      exp: '{{count}} = {{count}} + 1',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 1 times',
        },
      },
    });

    state().controllers.expression.evaluate(getView()?.exp);

    await waitFor(() =>
      expect(getView()).toStrictEqual({
        id: 'action',
        type: 'action',
        exp: '{{count}} = {{count}} + 1',
        label: {
          asset: {
            id: 'action-label',
            type: 'text',
            value: 'Clicked 2 times',
          },
        },
      })
    );
  });

  test('evaluates onEnd expression', () => {
    const updatedContent = {
      ...minimal,
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'VIEW_1',
          VIEW_1: {
            state_type: 'VIEW',
            onEnd: '{{count}} = {{count}} + 1',
            ref: 'view-1',
            transitions: {
              Next: 'VIEW_2',
            },
          },
          VIEW_2: {
            state_type: 'VIEW',
            ref: 'action',
            transitions: {
              '*': 'END_Done',
            },
          },
          END: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    };

    player.start(updatedContent as any);

    expect(getView()).toStrictEqual({
      id: 'view-1',
      type: 'view',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 0 times',
        },
      },
    });

    flowController?.transition('Next');

    expect(getView()).toStrictEqual({
      id: 'action',
      type: 'action',
      exp: '{{count}} = {{count}} + 1',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 1 times',
        },
      },
    });
  });

  test('evaluates onStart/onEnd expressions for action nodes', async () => {
    player.start({
      ...minimal,
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'ACTION_1',
          ACTION_1: {
            state_type: 'ACTION',
            exp: '{{count}} = 99',
            onStart: '{{count}} = {{count}} + 1',
            onEnd: '{{count}} = {{count}} + 1',
            transitions: {
              '*': 'VIEW_1',
            },
          },
          VIEW_1: {
            state_type: 'VIEW',
            ref: 'view-1',
            transitions: {
              '*': 'EXTERNAL_1',
            },
          },
          EXTERNAL_1: {
            state_type: 'EXTERNAL',
            ref: 'external-1',
            transitions: {},
          },
        },
      },
    });

    await waitFor(() =>
      expect(state().controllers.flow.current?.currentState?.name).toBe(
        'VIEW_1'
      )
    );

    /**
     * Expected eval order:
     * 1. onStart
     * 2. exp
     * 3. onEnd
     */
    await waitFor(() =>
      expect(getView()).toStrictEqual({
        id: 'view-1',
        type: 'view',
        label: {
          asset: {
            id: 'action-label',
            type: 'text',
            value: 'Clicked 100 times',
          },
        },
      })
    );
  });

  test('evaluates onEnd expressions last', async () => {
    player.start({
      ...minimal,
      data: {
        ...minimal.data,
        viewRef: 'initial-view',
      },
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'ACTION_1',
          ACTION_1: {
            state_type: 'ACTION',
            exp: "{{viewRef}} = 'view-exp'",
            onStart: "{{viewRef}} = 'view-onStart'",
            onEnd: "{{viewRef}} = 'view-1'",
            transitions: {
              '*': 'VIEW_1',
            },
          },
          VIEW_1: {
            state_type: 'VIEW',
            ref: 'view-1',
            transitions: {
              '*': 'EXTERNAL_1',
            },
          },
          EXTERNAL_1: {
            state_type: 'EXTERNAL',
            ref: 'external-1',
            transitions: {},
          },
        },
      },
    });

    await waitFor(() =>
      expect(state().controllers.flow.current?.currentState?.name).toBe(
        'VIEW_1'
      )
    );

    /**
     * Expected eval order:
     * 1. onStart
     * 2. exp
     * 3. onEnd
     */
    expect(getView()).toStrictEqual({
      id: 'view-1',
      type: 'view',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 0 times',
        },
      },
    });
  });

  test('triggers onStart before resolving view IDs', () => {
    player.start({
      id: 'resolve-view-flow',
      views: [
        {
          id: 'view-1',
          type: 'view',
        },
        {
          id: 'view-2',
          type: 'view',
        },
      ],
      data: {
        viewRef: 'view-1',
      },
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'VIEW_1',
          VIEW_1: {
            state_type: 'VIEW',
            onStart: "{{viewRef}} = 'view-2'",
            ref: '{{viewRef}}',
            transitions: {
              Next: 'END',
            },
          },
          END: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    });
    const currentFlowState = state().controllers.flow.current?.currentState
      ?.value as NavigationFlowViewState;
    expect(currentFlowState.ref).toBe('view-2');
  });

  const validationFlow: Flow = {
    id: 'validation-flow',
    views: [
      {
        id: 'view-1',
        type: 'view',
        label: {
          asset: {
            id: 'action-label',
            type: 'text',
            value: 'Clicked {{count}} times',
          },
        },
        alreadyInvalidData: {
          asset: {
            type: 'invalid',
            id: 'thing4',
            binding: 'data.thing4',
          },
        },
      },
      {
        id: 'action',
        type: 'action',
        exp: '{{count}} = {{count}} + 1',
        label: {
          asset: {
            id: 'action-label',
            type: 'text',
            value: 'Clicked {{count}} times',
          },
        },
      },
    ],
    data: {
      count: 0,
      data: {
        thing4: 'frodo',
      },
    },
    schema: {
      ROOT: {
        data: {
          type: 'DataType',
        },
      },
      DataType: {
        thing4: {
          type: 'CatType',
          validation: [
            {
              type: 'names',
              names: ['sam'],
            },
          ],
        },
      },
    },
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          onStart: '{{count}} = {{count}} + 1',
          onEnd: '{{count}} = {{count}} + 1',
          ref: 'view-1',
          transitions: {
            '*': 'VIEW_2',
          },
        },
        VIEW_2: {
          state_type: 'VIEW',
          onStart: '{{count}} = {{count}} + 1',
          ref: 'action',
          transitions: {
            '*': 'END_1',
          },
        },
        END_1: {
          state_type: 'END',
          outcome: 'test',
        },
      },
    },
  };

  test('prevents expression evaluation on unsuccessful validation', () => {
    player = new Player({
      plugins: [new TrackBindingPlugin()],
    });

    player.start(validationFlow);

    // Starts out with nothing
    expect(getView()?.alreadyInvalidData.asset.validation).toBe(undefined);

    // Evals initial onStart
    expect(getView()).toStrictEqual({
      id: 'view-1',
      type: 'view',
      label: {
        asset: {
          id: 'action-label',
          type: 'text',
          value: 'Clicked 1 times',
        },
      },
      alreadyInvalidData: {
        asset: {
          type: 'invalid',
          id: 'thing4',
          binding: 'data.thing4',
        },
      },
    });

    // Try to transition
    state().controllers.flow.transition('foo');

    // Stays on the same view
    expect(state().controllers.flow.current?.currentState?.name).toBe('VIEW_1');
    expect(getView()?.label.asset).toStrictEqual({
      id: 'action-label',
      type: 'text',
      value: 'Clicked 1 times',
    });

    // Fix the error.
    state().controllers.data.set([['data.thing4', 'sam']]);

    // Try to transition again
    state().controllers.flow.transition('foo');
    // Should work now that there's no error
    expect(state().controllers.flow.current?.currentState?.name).toBe('VIEW_2');
    // Evals previous onEnd and next onStart
    expect(getView()?.label.asset).toStrictEqual({
      id: 'action-label',
      type: 'text',
      value: 'Clicked 3 times',
    });
  });

  test('only evals exp prop for object', () => {
    const flowWithObjExp = {
      ...minimal,
      navigation: {
        ...minimal.navigation,
        FLOW_1: {
          ...(minimal.navigation as any).FLOW_1,
          onStart: {
            _comment: 'this should not fail',
            exp: '{{count}} = 11',
          },
        },
      },
    };

    player.start(flowWithObjExp);

    expect(state().controllers.data.get('count')).toBe(11);
  });
});
