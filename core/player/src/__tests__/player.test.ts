import { waitFor } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';

import type { ViewInstance } from '../view';
import { NodeType } from '../view';
import { Player } from '..';
import type { ViewController } from '..';
import actionsFlow from './helpers/actions.flow';
import type { InProgressState } from '../types';
import { ActionExpPlugin } from './helpers/action-exp.test';

const minimal = {
  id: 'minimal-player-content-response-format',
  topic: 'MOCK',
  schema: {},
  data: {},
  views: [
    {
      actions: [
        {
          asset: {
            id: 'action-1',
            type: 'action',
            value: 'Next',
            label: {
              asset: {
                id: 'Action-Label-Next',
                type: 'text',
                value: 'Continue',
              },
            },
          },
        },
      ],
      id: 'KitchenSink-View1',
      title: {
        asset: {
          id: 'KitchenSink-View1-Title',
          type: 'text',
          value: 'Minimal JSON Example',
        },
      },
      type: 'questionAnswer',
    },
  ],
  navigation: {
    BEGIN: 'KitchenSinkFlow',
    KitchenSinkFlow: {
      END_Done: {
        outcome: 'doneWithTopic',
        state_type: 'END',
      },
      VIEW_KitchenSink_1: {
        ref: 'KitchenSink-View1',
        state_type: 'VIEW',
        transitions: {
          '*': 'END_Done',
        },
      },
      startState: 'VIEW_KitchenSink_1',
    },
  },
};

test('it loads a flow', async () => {
  return new Promise<void>((resolve) => {
    const player = new Player();
    player.hooks.viewController.tap('test', (vc: ViewController) => {
      vc.hooks.view.tap('test', (view: ViewInstance) => {
        view.hooks.onUpdate.tap('test', (v: any) => {
          expect(v.id).toBe('KitchenSink-View1');
          resolve();
        });
      });
    });
    player.start(minimal as any);
  });
});

test('multiple data change only update view once', async () => {
  const player = new Player();

  const onUpdateCall = jest.fn();
  player.hooks.viewController.tap('test', (vc: ViewController) => {
    vc.hooks.view.tap('test', (view: ViewInstance) => {
      view.hooks.onUpdate.tap('test', onUpdateCall);
    });
  });

  player.start({
    id: 'test-flow',
    views: [
      {
        id: 't1',
        type: 'text',
        value: 'count is at {{count}}',
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
          ref: 't1',
          transitions: {
            '*': 'END_Done',
          },
        },
        END_Done: {
          state_type: 'END',
          outcome: 'done',
        },
      },
    },
  } as any);

  const state = player.getState() as InProgressState;

  expect(onUpdateCall).toBeCalledTimes(1);

  state.controllers.data.set([['count', 1]]);
  state.controllers.data.set([['count', 2]]);

  await waitFor(() => expect(onUpdateCall).toBeCalledTimes(2));
});

test('it handles multiple resolutions', async () => {
  const player = new Player({
    plugins: [new ActionExpPlugin()],
  });

  player.hooks.viewController.tap('action', (vc) => {
    vc.hooks.view.tap('action', (view) => {
      view.hooks.resolver.tap('action', (resolver) => {
        resolver.hooks.resolve.tap('action', (action, node, options) => {
          if (node.type !== NodeType.Asset || node.value.type !== 'action') {
            return action;
          }

          return {
            ...action,
            run() {
              options.evaluate(action.exp);
            },
          };
        });
      });
    });
  });

  player.start(actionsFlow as any);

  /** A helper to get the current view */
  const getView = () =>
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

  const state = player.getState() as InProgressState;
  let lastUpdate = state.controllers.view.currentView?.lastUpdate;
  lastUpdate?.values?.[1].asset.run();
  await waitFor(() => {
    lastUpdate = getView();

    expect(lastUpdate?.values[1].asset.label.asset.value).toBe(
      'Clicked 1 times'
    );
    expect(lastUpdate?.values[2].asset.label.asset.value).toBe(
      'Clicked 0 times'
    );
  });

  lastUpdate = state.controllers.view.currentView?.lastUpdate;

  lastUpdate?.values[2].asset.run();

  await waitFor(() => {
    lastUpdate = getView();

    expect(lastUpdate?.values[1].asset.label.asset.value).toBe(
      'Clicked 1 times'
    );
    expect(lastUpdate?.values[2].asset.label.asset.value).toBe(
      'Clicked 1 times'
    );
  });
});

test('it inserts data into the view', async () => {
  const player = new Player({
    plugins: [new ActionExpPlugin()],
  });
  player.start({
    id: 'action-with-expression',
    views: [
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
          ref: 'action',
          transitions: {
            '*': 'END_Done',
          },
        },
        END_Done: {
          state_type: 'END',
          outcome: 'done',
        },
      },
    },
  } as any);

  const started = player.getState() as InProgressState;

  expect(started.controllers.view.currentView?.lastUpdate).toStrictEqual({
    id: 'action',
    type: 'action',
    exp: '{{count}} = {{count}} + 1',
    label: {
      asset: {
        id: 'action-label',
        type: 'text',
        value: 'Clicked 0 times',
      },
    },
  });

  started.controllers.expression.evaluate(
    started.controllers.view.currentView?.lastUpdate?.exp
  );

  await waitFor(() =>
    expect(started.controllers.view.currentView?.lastUpdate).toStrictEqual({
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
    })
  );
});

test('handles non-present data', async () => {
  const simpleFlow = makeFlow({
    id: 'text',
    type: 'text',
    value: '{{some.data}}',
  });

  const player = new Player();
  player.start(simpleFlow);

  expect(
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate
  ).toStrictEqual({
    id: 'text',
    type: 'text',
    value: undefined,
  });

  (player.getState() as InProgressState).controllers.data.set([
    ['some.other.binding', 'Updated'],
  ]);

  expect(
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate
  ).toStrictEqual({
    id: 'text',
    type: 'text',
    value: undefined,
  });

  (player.getState() as InProgressState).controllers.data.set([
    ['some.data', 'Updated!'],
  ]);

  await waitFor(() =>
    expect(
      (player.getState() as InProgressState).controllers.view.currentView
        ?.lastUpdate
    ).toStrictEqual({
      id: 'text',
      type: 'text',
      value: 'Updated!',
    })
  );
});

test('allows for content mutation before processing', () => {
  const player = new Player();

  player.hooks.resolveFlowContent.tap('test', () => {
    return makeFlow({ id: 'new-flow', type: 'new' });
  });

  player.start(makeFlow({ id: 'old-flow', type: 'old' }));

  const state = player.getState() as InProgressState;

  expect(state.controllers.view.currentView?.lastUpdate).toStrictEqual({
    id: 'new-flow',
    type: 'new',
  });
});

describe('expressions', () => {
  it('works outside', async () => {
    const simpleFlow = makeFlow({
      id: 'text',
      type: 'text',
      value: '{{data.count1}} - {{data.count2}}',
    });

    simpleFlow.data = {
      data: {
        count1: 0,
        count2: 1,
      },
    };

    const player = new Player();
    player.start(simpleFlow);
    const state = player.getState() as InProgressState;
    expect(state.controllers.view.currentView?.lastUpdate?.value).toBe('0 - 1');

    state.controllers.expression.evaluate([
      '{{data.count1}} = 5',
      '{{data.count2}} = 10',
    ]);
    await waitFor(() =>
      expect(state.controllers.view.currentView?.lastUpdate?.value).toBe(
        '5 - 10'
      )
    );
  });

  it('works with local expressions', async () => {
    const simpleFlow = makeFlow({
      id: 'text',
      type: 'text',
      value: '{{label1}} @[ label2 ]@',
    });

    const player = new Player();
    player.start(simpleFlow);
    const state = player.getState() as InProgressState;

    state.controllers.expression.evaluate(['label2 = 5', '{{label1}} = 10']);
    await waitFor(() =>
      expect(state.controllers.view.currentView?.lastUpdate?.value).toBe('10 5')
    );

    state.controllers.expression.evaluate(['{{label1}} = 20']);
    await waitFor(() =>
      expect(state.controllers.view.currentView?.lastUpdate?.value).toBe('20 5')
    );
  });

  it('works inside transform', async () => {
    const simpleFlow = makeFlow({
      id: 'action',
      type: 'action',
      exp: ['{{data.count1}} = 5', '{{data.count2}} = 10'],
      value: '{{data.count1}} - {{data.count2}}',
    });

    simpleFlow.data = {
      data: {
        count1: 0,
        count2: 1,
      },
    };

    const player = new Player({ plugins: [new ActionExpPlugin()] });

    player.hooks.view.tap('test', (view) => {
      view.hooks.resolver.tap('test', (resolver) => {
        resolver.hooks.afterResolve.tap('test', (val, node, options) => {
          if (node.type === NodeType.View && val.type === 'action') {
            return {
              ...val,
              run: () => options.evaluate(val.exp),
            };
          }

          return val;
        });
      });
    });

    player.start(simpleFlow);
    const state = player.getState() as InProgressState;
    expect(state.controllers.view.currentView?.lastUpdate?.value).toBe('0 - 1');
    expect(state.controllers.view.currentView?.lastUpdate?.exp).toStrictEqual([
      '{{data.count1}} = 5',
      '{{data.count2}} = 10',
    ]);
    state.controllers.view.currentView?.lastUpdate?.run();

    await waitFor(() =>
      expect(state.controllers.view.currentView?.lastUpdate?.value).toBe(
        '5 - 10'
      )
    );
  });

  it('recognizes inline format expressions', () => {
    const simpleFlow = makeFlow({
      id: 'inline-format-text',
      type: 'text',
      value: "this should be upper case: @[ format('aaaa', 'CAPS') ]@",
    });

    const player = new Player();

    player.hooks.schema.tap('test', (schema) => {
      schema.addFormatters([
        {
          name: 'CAPS',
          format: (value: string) => value.toUpperCase(),
        },
      ]);
    });

    player.start(simpleFlow);
    const state = player.getState() as InProgressState;
    const lastUpdate = state.controllers.view.currentView?.lastUpdate as any;
    expect(lastUpdate.value).toBe('this should be upper case: AAAA');
  });
});

describe('formatting', () => {
  it('formats by reference', () => {
    const player = new Player();
    player.hooks.schema.tap('test', (schema) => {
      schema.addFormatters([
        {
          name: 'CAPS',
          format: (value: string) => value.toUpperCase(),
        },
      ]);
    });

    player.hooks.viewController.tap('test', (vc) => {
      vc.hooks.view.tap('test', (v) => {
        v.hooks.resolver.tap('test', (resolver) => {
          resolver.hooks.resolve.tap('test', (value, node, options) => {
            if (value && value.type === 'text') {
              return {
                ...value,
                value: options.data.formatValue({ type: 'CAPS' }, value.value),
              };
            }

            return value;
          });
        });
      });
    });

    player.start(minimal as any);

    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.title.asset.value
    ).toBe('MINIMAL JSON EXAMPLE');
  });
});

describe('failure cases', () => {
  it('handles non-existant views', async () => {
    const player = new Player();

    const flow = makeFlow({ id: 'view-1', type: 'text', value: 'Title' });
    flow.views![0].id = 'not-view-1';

    await expect(player.start(flow)).rejects.toThrowError(
      'No view with id view-1'
    );
  });

  it('handles plugins throwing errors', async () => {
    const player = new Player({
      plugins: [
        {
          name: 'test',
          apply(p) {
            p.hooks.bindingParser.tap('error', (b) => {
              (b as any).notThere();
            });
          },
        },
      ],
    });

    const flow = makeFlow({ id: 'view-1', type: 'text', value: 'Title' });

    await expect(player.start(flow)).rejects.toThrowError(
      'b.notThere is not a function'
    );
  });

  it('handles non-existent view', async () => {
    const player = new Player();
    const flow = makeFlow({ id: 'view-1', type: 'text', value: 'Title' });
    flow.views![0].id = 'other-id';

    await expect(player.start(flow)).rejects.toThrowError(
      `No view with id view-1`
    );
  });

  it('fails gracefully when states after an ACTION state have failures', async () => {
    const player = new Player();

    const payload = {
      id: 'test',
      views: [
        {
          id: 'view',
          type: 'text',
          value: 'Some text',
        },
      ],
      data: {},
      navigation: {
        BEGIN: 'Flow',
        Flow: {
          startState: 'ActionState',
          ActionState: {
            state_type: 'ACTION',
            transitions: {
              '*': 'ViewState',
            },
          },
          ViewState: {
            state_type: 'VIEW',
            ref: 'non-existing-view',
          },
        },
      },
    };

    const response = player.start(makeFlow(payload));

    await expect(response).rejects.toThrowError(
      'No view with id non-existing-view'
    );
  });

  it('can be failed from other places', async () => {
    const player = new Player();

    const response = player.start(
      makeFlow({ type: 'text', id: 'text', value: 'View' })
    );

    const state = player.getState() as InProgressState;

    state.fail(new Error('Custom Error'));

    await expect(response).rejects.toThrowError('Custom Error');
  });
});
