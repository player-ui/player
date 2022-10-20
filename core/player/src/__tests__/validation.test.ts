import { omit } from 'timm';
import { makeFlow } from '@player-ui/make-flow';
import { waitFor } from '@testing-library/react';
import type { Flow } from '@player-ui/types';
import type { SchemaController } from '../schema';
import type { BindingParser } from '../binding';
import TrackBindingPlugin, { addValidator } from './helpers/binding.plugin';
import { Player } from '..';
import type { ValidationController } from '../controllers/validation';
import type { InProgressState } from '../types';
import TestExpressionPlugin from './helpers/expression.plugin';

const simpleFlow: Flow = {
  id: 'test-flow',
  views: [
    {
      id: 'view-1',
      type: 'view',
      thing1: {
        asset: {
          type: 'whatevs',
          id: 'thing1',
          binding: 'data.thing1',
        },
      },
      thing2: {
        asset: {
          type: 'whatevs',
          id: 'thing2',
          binding: 'data.thing2',
        },
      },
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: 'DataType',
      },
    },
    DataType: {
      thing1: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['frodo', 'sam'],
            severity: 'warning',
          },
        ],
      },
      thing2: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['frodo', 'sam'],
            severity: 'warning',
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
        ref: 'view-1',
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
const simpleExpressionFlow: Flow = {
  id: 'test-flow',
  views: [
    {
      id: 'view-1',
      type: 'view',
      foo: {
        asset: {
          type: 'whatevs',
          id: 'foo',
          binding: 'data.foo',
        },
      },
      foo2: {
        asset: {
          type: 'whatevs',
          id: 'foo2',
          binding: 'data.foo2',
        },
      },
      bar: {
        asset: {
          type: 'whatevs',
          id: 'bar',
          binding: 'data.bar',
        },
      },
      bar2: {
        asset: {
          type: 'whatevs',
          id: 'bar2',
          binding: 'data.bar2',
        },
      },
    },
  ],
  data: {},
  schema: {
    ROOT: {
      data: {
        type: 'DataType',
      },
    },
    DataType: {
      foo: {
        type: 'CatType',
        validation: [
          {
            type: 'expression',
            exp: '!(isEmpty({{data.foo}}) && !isEmpty({{data.foo2}}))',
            severity: 'warning',
          },
        ],
      },
      bar: {
        type: 'CatType',
        validation: [
          {
            type: 'expression',
            exp: '!(isEmpty({{data.bar}}) && !isEmpty({{data.bar2}}))',
            severity: 'warning',
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
        ref: 'view-1',
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

const flowWithThings: Flow = {
  id: 'test-flow',
  views: [
    {
      id: 'view-1',
      type: 'view',
      thing1: {
        asset: {
          type: 'whatevs',
          id: 'thing1',
          binding: 'data.thing1',
          applicability: '{{applicability.thing1}}',
        },
      },
      thing2: {
        asset: {
          type: 'whatevs',
          id: 'thing2',
          binding: 'data.thing2',
          applicability: '{{applicability.thing2}}',
        },
      },
      thing3: {
        asset: {
          type: 'whatevs',
          id: 'thing3',
          applicability: '{{applicability.thing3}}',
          binding: 'data.thing3',
          other: {
            asset: {
              type: 'whatevs',
              id: 'thing3a',
              binding: 'data.thing3a',
              applicability: '{{applicability.thing3a}}',
            },
          },
        },
      },
      thing5: {
        asset: {
          type: 'section',
          id: 'thing5',
          binding: 'data.thing5',
          applicability: '{{applicability.thing5}}',
          thing6: {
            asset: {
              type: 'section',
              id: 'thing6',
              binding: 'data.thing6',
              applicability: '{{applicability.thing6}}',
              thing7: {
                asset: {
                  type: 'whatevs',
                  id: 'thing7',
                  binding: 'data.thing7',
                  applicability: '{{applicability.thing7}}',
                },
              },
            },
          },
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
  ],
  data: {
    applicability: {
      thing1: true,
      thing2: true,
      thing3: true,
      thing3a: true,
      thing5: true,
      thing6: true,
      thing7: true,
    },
    data: {
      thing2: 'frodo',
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
      thing2: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['frodo', 'sam'],
          },
        ],
      },
      thing4: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['sam'],
          },
        ],
      },
      thing5: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['frodo'],
            displayTarget: 'page',
          },
        ],
      },
      thing6: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['sam'],
            displayTarget: 'section',
          },
        ],
      },
      thing7: {
        type: 'CatType',
        validation: [
          {
            type: 'names',
            names: ['bilbo'],
            displayTarget: 'section',
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
        ref: 'view-1',
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

test('alt APIs', async () => {
  const player = new Player();

  player.hooks.validationController.tap('test', (validationProvider) => {
    addValidator(validationProvider);
  });

  player.hooks.viewController.tap('test', (vc) => {
    vc.hooks.view.tap('test', (view) => {
      view.hooks.resolver.tap('test', (resolver) => {
        resolver.hooks.resolve.tap('test', (val, node, options) => {
          if (val.type === 'section') {
            options.validation?.register({ type: 'section' });
          }

          if (val?.binding) {
            return {
              ...val,
              validation: options.validation?.get(val.binding, { track: true }),
              childValidations: options.validation?.getChildren,
              sectionValidations: options.validation?.getValidationsForSection,
              allValidations: options.validation?.getAll(),
            };
          }

          return {
            ...val,
            childValidations: options.validation?.getChildren,
            groupValidations: options.validation?.getValidationsForSection,
            allValidations: options.validation?.getAll(),
          };
        });
      });
    });
  });
  player.start(flowWithThings);

  const state = player.getState() as InProgressState;

  // Starts out with nothing
  expect(
    state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
  ).toBe(undefined);

  // Updates when data is updated to throw an error
  state.controllers.data.set([['data.thing2', 'ginger']]);
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
    ).toMatchObject({
      severity: 'error',
      message: `Names just be in: frodo,sam`,
      displayTarget: 'field',
    })
  );

  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.allValidations.values()
    )
  ).toMatchObject([
    {
      severity: 'error',
      message: `Names just be in: frodo,sam`,
      displayTarget: 'field',
    },
  ]);

  // check that the childValidations and sectionValidation computation works and
  state.controllers.data.set([['data.thing5', 'sam']]);
  state.controllers.data.set([['data.thing6', 'frodo']]);
  state.controllers.data.set([['data.thing7', 'golumn']]);

  // Gets all page errors for all children
  await waitFor(() =>
    expect(
      Array.from(
        state.controllers.view.currentView?.lastUpdate
          ?.childValidations('page')
          .values()
      )
    ).toMatchObject([
      {
        severity: 'error',
        message: `Names just be in: frodo`,
        displayTarget: 'page',
      },
    ])
  );

  // Gets all section errors for all children
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate
        ?.childValidations('section')
        .values()
    )
  ).toMatchObject([
    {
      severity: 'error',
      message: `Names just be in: sam`,
      displayTarget: 'section',
    },
    {
      severity: 'error',
      message: `Names just be in: bilbo`,
      displayTarget: 'section',
    },
  ]);

  // Gets section error for child that is not wrapped in nested section
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing5.asset
        ?.sectionValidations()
        .values()
    )
  ).toMatchObject([
    {
      severity: 'error',
      message: `Names just be in: sam`,
      displayTarget: 'section',
    },
  ]);

  // Ensure that nested section still produces an error
  expect(
    Array.from(
      state.controllers.view.currentView?.lastUpdate?.thing5.asset.thing6.asset
        ?.sectionValidations()
        .values()
    )
  ).toMatchObject([
    {
      severity: 'error',
      message: `Names just be in: bilbo`,
      displayTarget: 'section',
    },
  ]);
});

describe('validation', () => {
  let player: Player;
  let validationController: ValidationController;
  let schema: SchemaController;
  let parser: BindingParser;

  beforeEach(() => {
    player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.hooks.validationController.tap('test', (vc) => {
      validationController = vc;
    });
    player.hooks.schema.tap('test', (s) => {
      schema = s;
    });
    player.hooks.bindingParser.tap('test', (p) => {
      parser = p;
    });

    player.start(flowWithThings);
  });

  describe('binding tracker', () => {
    it('tracks bindings in the view', () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);
    });

    it('preserves tracked bindings for non-updated things', () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);

      (player.getState() as InProgressState).controllers.data.set([
        ['not.there', false],
      ]);
      expect(validationController?.getBindings().size).toStrictEqual(8);
    });

    it('drops bindings for non-applicable things', async () => {
      expect(validationController?.getBindings().size).toStrictEqual(8);

      (player.getState() as InProgressState).controllers.data.set([
        ['applicability.thing3', false],
      ]);

      await waitFor(() =>
        expect(validationController?.getBindings().size).toStrictEqual(6)
      );
    });
  });

  describe('schema', () => {
    it('tests the types right', () => {
      expect(schema.getType(parser.parse('data.thing2'))?.type).toBe('CatType');
    });
  });

  describe('state', () => {
    it('updates when setting data', async () => {
      const state = player.getState() as InProgressState;

      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).toBe(undefined);

      // Updates when data is updated to throw an error
      state.controllers.data.set([['data.thing2', 'ginger']]);
      await waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation
        ).toMatchObject({
          severity: 'error',
          message: `Names just be in: frodo,sam`,
          displayTarget: 'field',
        })
      );

      // Back to nothing when the error is fixed
      state.controllers.data.set([['data.thing2', 'frodo']]);
      await waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation
        ).toBe(undefined)
      );
    });
  });

  describe('validation object', () => {
    it('returns the whole validation object', async () => {
      const state = player.getState() as InProgressState;

      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).toBe(undefined);

      // Updates when data is updated to throw an error
      state.controllers.data.set([['data.thing2', 'ginger']]);
      await waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation
        ).toStrictEqual({
          severity: 'error',
          message: `Names just be in: frodo,sam`,
          names: ['frodo', 'sam'],
          displayTarget: 'field',
          trigger: 'change',
          type: 'names',
        })
      );

      // Back to nothing when the error is fixed
      state.controllers.data.set([['data.thing2', 'frodo']]);
      await waitFor(() =>
        expect(
          state.controllers.view.currentView?.lastUpdate?.thing2.asset
            .validation
        ).toBe(undefined)
      );
    });
  });

  describe('navigation', () => {
    it('prevents navigation for pre-existing invalid data', async () => {
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.alreadyInvalidData.asset
          .validation
      ).toBe(undefined);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      // Fix the error.
      state.controllers.data.set([['data.thing4', 'sam']]);
      state.controllers.data.set([['data.thing5', 'frodo']]);
      state.controllers.data.set([['data.thing6', 'sam']]);
      state.controllers.data.set([['data.thing7', 'bilbo']]);

      // Try to transition again
      state.controllers.flow.transition('foo');

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe('test');
    });

    it('doesnt remove existing warnings if a new warning is triggered', async () => {
      player.start(simpleFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.thing1', 'sam']]);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).not.toBe(undefined);

      state.controllers.data.set([['data.thing1', 'bilbo']]);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      // New validation warning
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).not.toBe(undefined);

      // Existing warning stays
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).not.toBe(undefined);

      state.controllers.data.set([['data.thing1', 'frodo']]);
      state.controllers.data.set([['data.thing2', 'sam']]);

      // Try to transition again
      state.controllers.flow.transition('foo');

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe('test');
    });
    it('doesnt remove existing expression warnings if a new warning is triggered', async () => {
      player.hooks.expressionEvaluator.tap('test', (evaluator) => {
        evaluator.addExpressionFunction('isEmpty', (ctx: any, val: any) => {
          if (val === undefined || val === null) {
            return true;
          }

          if (typeof val === 'string') {
            return val.length === 0;
          }

          return false;
        });
      });
      player.start(simpleExpressionFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.foo2', 'someData']]);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo2.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar2.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.bar2', 'someData']]);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      // existing validation
      // FAILS HERE
      expect(
        state.controllers.view.currentView?.lastUpdate?.foo.asset.validation
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.foo2.asset.validation
      ).toBe(undefined);

      // new validation
      expect(
        state.controllers.view.currentView?.lastUpdate?.bar.asset.validation
      ).not.toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.bar2.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.foo', 'frodo']]);
      state.controllers.data.set([['data.bar', 'sam']]);

      // Try to transition again
      state.controllers.flow.transition('foo');

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe('test');
    });

    it('doesnt remove existing warnings if a new warning is triggered - manual dismiss', async () => {
      player.start(simpleFlow);
      const state = player.getState() as InProgressState;
      const { flowResult } = state;
      // Starts out with nothing
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.thing1', 'sam']]);

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBe(undefined);

      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).not.toBe(undefined);

      state.controllers.data.set([['data.thing1', 'bilbo']]);
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation.dismiss();

      // Try to transition
      state.controllers.flow.transition('foo');

      // Stays on the same view
      expect(
        state.controllers.flow.current?.currentState?.value.state_type
      ).toBe('VIEW');

      // New validation warning
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).not.toBe(undefined);

      // Existing warning stays
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
      ).toBe(undefined);

      state.controllers.data.set([['data.thing1', 'frodo']]);
      // state.controllers.data.set([['data.thing2', 'sam']]);

      // Try to transition again
      state.controllers.flow.transition('foo');

      // Should work now that there's no error
      const result = await flowResult;
      expect(result.endState.outcome).toBe('test');
    });
  });
});

describe('cross-field validation', () => {
  const crossFieldFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    thing2: {
      asset: {
        id: 'thing-2',
        binding: 'foo.data.thing2',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'expression',
        ref: 'foo.data.thing1',
        message: 'Both need to equal 100',
        exp: '{{foo.data.thing1}} + {{foo.data.thing2}} == 100',
      },
    ],
  });

  it('works for navigate triggers', async () => {
    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(crossFieldFlow);
    const state = player.getState() as InProgressState;

    // Validation starts as nothing
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBe(undefined);

    // Updating a thing is still nothing (haven't navigated yet)
    state.controllers.data.set([['foo.data.thing1', 20]]);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBe(undefined);

    // Try to navigate, should show the validation now
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      severity: 'error',
      message: 'Both need to equal 100',
      displayTarget: 'field',
    });

    // Updating a thing is still nothing (haven't navigated yet)
    state.controllers.data.set([['foo.data.thing2', 85]]);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      severity: 'error',
      message: 'Both need to equal 100',
      displayTarget: 'field',
    });

    // Set it equal to 100 and continue on
    state.controllers.data.set([['foo.data.thing2', 80]]);
    state.controllers.flow.transition('next');

    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });
});

test('shows errors on load', () => {
  const errFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        message: 'Stuffs broken',
        trigger: 'load',
        severity: 'error',
      },
    ],
  });

  const player = new Player({ plugins: [new TrackBindingPlugin()] });
  player.start(errFlow);
  const state = player.getState() as InProgressState;

  // Validation starts with a warning on load
  expect(
    state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
  ).toMatchObject({
    message: 'Stuffs broken',
    severity: 'error',
    displayTarget: 'field',
  });
});
describe('errors', () => {
  const errorFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        severity: 'error',
      },
    ],
  });
  const nonBlockingErrorFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        severity: 'error',
        blocking: false,
      },
    ],
  });
  const onceBlockingErrorFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        severity: 'error',
        blocking: 'once',
      },
    ],
  });

  it('blocks navigation by default', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(errorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and display the error
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      message: 'A value is required',
      severity: 'error',
      displayTarget: 'field',
    });

    // Try to navigate, should prevent the navigation and keep displaying the error
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
  });
  it('blocking once allows navigation on second attempt', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(onceBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should prevent the navigation and display the error
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      message: 'A value is required',
      severity: 'error',
      displayTarget: 'field',
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });
  it('blocking false allows navigation', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(nonBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    // Try to navigate, should allow navigation because blocking is false
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });
  it('blocking false still shows validation', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(nonBlockingErrorFlow);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      message: 'A value is required',
      severity: 'error',
      displayTarget: 'field',
    });

    // Try to navigate, should allow navigation because blocking is false
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });
});
describe('warnings', () => {
  const warningFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        severity: 'warning',
      },
    ],
  });

  const blockingWarningFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        blocking: true,
        severity: 'warning',
      },
    ],
  });

  const onceBlockingWarningFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.data.thing1',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'required',
        ref: 'foo.data.thing1',
        trigger: 'load',
        blocking: 'once',
        severity: 'warning',
      },
    ],
  });

  it('shows warnings on load', () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlow);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });
  });

  it('auto-dismiss on double-navigation', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlow);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });

  it('blocking warnings dont auto-dismiss on double-navigation', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(blockingWarningFlow);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
  });

  it('once blocking warnings auto-dismiss on double-navigation', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(onceBlockingWarningFlow);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Try to navigate, should prevent the navigation and keep the warning
    state.controllers.flow.transition('next');
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'VIEW'
    );
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    // Navigate _again_ this should dismiss it
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });

  it('triggers re-render on dismiss call', () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(warningFlow);
    const state = player.getState() as InProgressState;

    // Validation starts with a warning on load
    expect(
      omit(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation,
        'dismiss'
      )
    ).toMatchObject({
      message: 'A value is required',
      severity: 'warning',
      displayTarget: 'field',
    });

    state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation.dismiss();
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBe(undefined);

    // Should be able to navigate w/o issues
    state.controllers.flow.transition('next');
    // We make it to the next state
    expect(state.controllers.flow.current?.currentState?.value.state_type).toBe(
      'END'
    );
  });
});

describe('validation within arrays', () => {
  const arrayFlow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'thing.1.data.3.name',
        type: 'input',
      },
    },
    thing2: {
      asset: {
        id: 'thing-2',
        binding: 'thing.2.data.0.name',
        type: 'input',
      },
    },
  });

  arrayFlow.schema = {
    ROOT: {
      thing: {
        type: 'ThingType',
        isArray: true,
      },
    },
    ThingType: {
      data: {
        type: 'DataType',
        isArray: true,
      },
    },
    DataType: {
      name: {
        type: 'StringType',
        validation: [
          {
            type: 'required',
          },
        ],
      },
    },
  };

  it('validates things correctly within an array', async () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(arrayFlow);
    const state = player.getState() as InProgressState;

    // Nothing initially
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBe(undefined);
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
    ).toBe(undefined);

    // Error if set to an falsy value
    state.controllers.data.set([['thing.1.data.3.name', '']]);
    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toMatchObject({
        severity: 'error',
        message: 'A value is required',
        displayTarget: 'field',
      })
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
    ).toBe(undefined);

    // Other one gets error if i try to navigate
    state.controllers.data.set([['thing.1.data.3.name', 'adam']]);
    state.controllers.flow.transition('anything');
    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBe(undefined)
    );
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing2.asset.validation
    ).toMatchObject({
      severity: 'error',
      message: 'A value is required',
      displayTarget: 'field',
    });
  });
});

describe('models can get valid or invalid data', () => {
  const flow = makeFlow({
    asset: {
      id: 'input-2',
      type: 'input',
      binding: 'person.name',
      label: {
        asset: {
          id: 'input-2-label',
          type: 'text',
          value: 'Name',
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: 'PersonType',
      },
    },
    PersonType: {
      name: {
        type: 'StringType',
        validation: [
          {
            type: 'names',
            names: ['frodo', 'sam'],
          },
        ],
      },
    },
  };

  it('gets both', () => {
    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([['person.name', 'adam']]);

    expect(state.controllers.data.get('person.name')).toBe(undefined);
    expect(
      state.controllers.data.get('person.name', { includeInvalid: true })
    ).toBe('adam');

    state.controllers.data.set([['person.name', 'sam']]);
    expect(state.controllers.data.get('person.name')).toBe('sam');
    expect(
      state.controllers.data.get('person.name', { includeInvalid: true })
    ).toBe('sam');
  });
});

test('validations can run against formatted or deformatted values', async () => {
  const flow = makeFlow({
    asset: {
      id: 'input-2',
      type: 'input',
      binding: 'person.name',
      label: {
        asset: {
          id: 'input-2-label',
          type: 'text',
          value: 'Name',
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: 'PersonType',
      },
    },
    PersonType: {
      name: {
        type: 'NumberType',
        format: {
          type: 'indexOf',
          options: ['frodo', 'sam'],
        },
        validation: [
          {
            type: 'names',
            dataTarget: 'formatted',
            names: ['frodo', 'sam'],
          },
        ],
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });

  player.start(flow);
  const state = player.getState() as InProgressState;

  state.controllers.data.set([['person.name', 0]]);
  expect(state.controllers.data.get('person.name')).toBe(0);
  expect(
    state.controllers.view.currentView?.lastUpdate?.validation
  ).toBeUndefined();

  state.controllers.data.set([['person.name', 'adam']], { formatted: true });
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.validation.message
    ).toBe('Names just be in: frodo,sam')
  );

  state.controllers.data.set([['person.name', 'sam']], { formatted: true });
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.validation
    ).toBeUndefined()
  );
});

test('tracking a binding commits the default value', () => {
  const flow = makeFlow({
    asset: {
      id: 'input-2',
      type: 'input',
      binding: 'person.name',
      label: {
        asset: {
          id: 'input-2-label',
          type: 'text',
          value: '{{other.name}}',
        },
      },
    },
  });

  flow.schema = {
    ROOT: {
      person: {
        type: 'PersonType',
      },
      other: {
        type: 'PersonType',
      },
    },
    PersonType: {
      name: {
        type: 'StringType',
        default: 'Adam',
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });

  player.start(flow);
  const state = player.getState() as InProgressState;
  expect(state.controllers.data.get('person.name')).toBe('Adam');
  expect(state.controllers.data.get('other.name')).toBe('Adam');
  expect(
    state.controllers.view.currentView?.lastUpdate?.label.asset.value
  ).toBe('Adam');
  expect(state.controllers.data.get('')).toStrictEqual({
    person: { name: 'Adam' },
  });
});

test('validates on expressions outside of view', async () => {
  const flowWithExp: Flow = {
    id: 'flow-with-exp',
    views: [
      {
        id: 'view-1',
        type: 'view',
        fields: {
          asset: {
            id: 'input',
            type: 'input',
            binding: 'person.name',
          },
        },
      },
    ],
    data: { person: { name: 'frodo' } },
    schema: {
      ROOT: {
        person: {
          type: 'PersonType',
        },
      },
      PersonType: {
        name: {
          type: 'String',
          validation: [
            {
              type: 'names',
              dataTarget: 'formatted',
              names: ['frodo', 'sam'],
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
          ref: 'view-1',
          transitions: {
            '*': 'ACTION_1',
          },
        },
        ACTION_1: {
          state_type: 'ACTION',
          exp: '{{person.name}} = "invalid"',
          transitions: {
            '*': 'END_1',
          },
        },
        END_1: {
          state_type: 'END',
          outcome: 'done',
        },
      },
    },
  };

  const player = new Player({ plugins: [new TrackBindingPlugin()] });
  const outcome = player.start(flowWithExp);

  const state = player.getState() as InProgressState;
  state.controllers.flow.transition('Next');

  const response = await outcome;
  expect(response.data).toStrictEqual({ person: { name: 'frodo' } });
});
describe('Validations with custom field messages', () => {
  it('can evaluate expressions in message', async () => {
    const flow = makeFlow({
      id: 'view-1',
      type: 'view',
      thing1: {
        asset: {
          id: 'thing-1',
          binding: 'foo.data.thing1',
          type: 'input',
        },
      },
      validation: [
        {
          type: 'expression',
          ref: 'foo.data.thing1',
          message: 'The entered value {{foo.data.thing1}} is greater than 100',
          exp: '{{foo.data.thing1}} < 100',
        },
      ],
    });
    const player = new Player({
      plugins: [new TrackBindingPlugin()],
    });
    player.start(flow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([['foo.data.thing1', 200]]);
    state.controllers.flow.transition('next');
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toMatchObject({
      severity: 'error',
      message: 'The entered value 200 is greater than 100',
      displayTarget: 'field',
    });
  });

  it('can templatize messages', async () => {
    const errFlow = makeFlow({
      id: 'view-1',
      type: 'view',
      thing1: {
        asset: {
          id: 'thing-1',
          binding: 'foo.data.thing1',
          type: 'integer',
        },
      },
      validation: [
        {
          type: 'integer',
          ref: 'foo.data.thing1',
          message:
            'foo.data.thing1 is a number. You have provided a value of %type, which is correct. But floored value, %flooredValue is not equal to entered value, %value',
          trigger: 'load',
          severity: 'error',
        },
      ],
    });

    const player = new Player({ plugins: [new TrackBindingPlugin()] });
    player.start(errFlow);
    const state = player.getState() as InProgressState;

    state.controllers.data.set([['foo.data.thing1', 200.567]]);

    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toMatchObject({
        message:
          'foo.data.thing1 is a number. You have provided a value of number, which is correct. But floored value, 200 is not equal to entered value, 200.567',
        severity: 'error',
        displayTarget: 'field',
      })
    );
  });
});

describe('Validations with multiple inputs', () => {
  const complexValidation = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'thing-1',
        binding: 'foo.a',
        type: 'input',
      },
    },
    thing2: {
      asset: {
        id: 'thing-2',
        binding: 'foo.b',
        type: 'input',
      },
    },
    validation: [
      {
        type: 'expression',
        ref: 'foo.a',
        message: 'Both need to equal 100',
        exp: 'sumValues(["foo.a", "foo.b"]) == 100',
        severity: 'error',
        trigger: 'load',
      },
    ],
  });

  let player: Player;
  let validationController: ValidationController;
  let schema: SchemaController;
  let parser: BindingParser;

  beforeEach(() => {
    player = new Player({
      plugins: [new TrackBindingPlugin(), new TestExpressionPlugin()],
    });
    player.hooks.validationController.tap('test', (vc) => {
      validationController = vc;
    });
    player.hooks.schema.tap('test', (s) => {
      schema = s;
    });
    player.hooks.bindingParser.tap('test', (p) => {
      parser = p;
    });

    player.start(flowWithThings);
  });

  it('Throws errors when a weak referenced field is changed', async () => {
    complexValidation.data = {
      foo: {
        a: 90,
        b: 10,
      },
    };

    player.start(complexValidation);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBeUndefined();

    state.controllers.data.set([['foo.b', 70]]);
    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toMatchObject({
        severity: 'error',
        message: 'Both need to equal 100',
      })
    );

    expect(
      state.controllers.data.get('', { includeInvalid: false })
    ).toMatchObject({
      foo: {
        a: 90,
        b: 10,
      },
    });

    expect(
      state.controllers.data.get('', { includeInvalid: true })
    ).toMatchObject({
      foo: {
        a: 90,
        b: 70,
      },
    });
  });

  it('Clears errors when a weak referenced field is changed', async () => {
    complexValidation.data = {
      foo: {
        a: 90,
        b: 10,
      },
    };

    player.start(complexValidation);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
    ).toBeUndefined();

    state.controllers.data.set([['foo.a', 15]]);
    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toMatchObject({
        severity: 'error',
        message: 'Both need to equal 100',
      })
    );

    expect(
      state.controllers.data.get('', { includeInvalid: false })
    ).toMatchObject({
      foo: {
        a: 90,
        b: 10,
      },
    });

    expect(
      state.controllers.data.get('', { includeInvalid: true })
    ).toMatchObject({
      foo: {
        a: 15,
        b: 10,
      },
    });

    state.controllers.data.set([['foo.b', 85]]);

    await waitFor(() =>
      expect(
        state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
      ).toBeUndefined()
    );

    expect(
      state.controllers.data.get('', { includeInvalid: false })
    ).toMatchObject({
      foo: {
        a: 15,
        b: 85,
      },
    });

    expect(
      state.controllers.data.get('', { includeInvalid: true })
    ).toMatchObject({
      foo: {
        a: 15,
        b: 85,
      },
    });
  });
});
