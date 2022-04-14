import { waitFor } from '@testing-library/react';
import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { ComputedPropertiesPlugin } from '..';

const flowWithComputedValues = makeFlow({
  id: 'view-1',
  type: 'view',
  value: '{{foo.bar.computedValue}}',
  otherValue: '{{foo.bar.otherValue}}',
});

flowWithComputedValues.schema = {
  ROOT: {
    foo: {
      type: 'FooType',
    },
  },
  FooType: {
    bar: {
      type: 'BarType',
    },
  },
  BarType: {
    computedValue: {
      type: 'Expression',
      exp: '1 + 2 + 3',
    },
  },
} as any;

flowWithComputedValues.data = {
  foo: {
    bar: {
      otherValue: 'not 6',
    },
  },
};

test('computes property values for Expression schema types', () => {
  const player = new Player({ plugins: [new ComputedPropertiesPlugin()] });
  player.start(flowWithComputedValues);

  const currentState = player.getState() as InProgressState;

  expect(currentState.controllers.view.currentView?.lastUpdate).toStrictEqual({
    id: 'view-1',
    type: 'view',
    value: 6,
    otherValue: 'not 6',
  });
});

test('throws an error if writing to a computed value', () => {
  const player = new Player({ plugins: [new ComputedPropertiesPlugin()] });
  player.start(flowWithComputedValues);

  const state = player.getState() as InProgressState;

  expect(() =>
    state.controllers.data.set([['foo.bar.computedValue', 'val']])
  ).toThrowError(
    "Invalid 'set' operation on computed property: foo.bar.computedValue"
  );
});

test('sets fall through', () => {
  const player = new Player({ plugins: [new ComputedPropertiesPlugin()] });
  player.start(flowWithComputedValues);

  const state = player.getState() as InProgressState;

  expect(state.controllers.data.get('foo.bar.otherValue')).toBe('not 6');
  state.controllers.data.set([['foo.bar.otherValue', 'updated']]);
  expect(state.controllers.data.get('foo.bar.otherValue')).toBe('updated');
});

const flowWithComputedApplicability = makeFlow({
  id: 'view-1',
  type: 'view',
  label: {
    asset: {
      applicability: '{{foo.computedValue}}',
      id: 'label',
      type: 'text',
      value: 'view label',
    },
  },
});

flowWithComputedApplicability.schema = {
  ROOT: {
    foo: {
      type: 'FooType',
    },
  },
  FooType: {
    computedValue: {
      type: 'Expression',
      exp: '{{foo.type}} === "valid"',
    },
  },
};

flowWithComputedApplicability.data = {
  foo: { type: 'not-valid' },
};

test('updates work across computations', async () => {
  const player = new Player({ plugins: [new ComputedPropertiesPlugin()] });
  player.start(flowWithComputedApplicability);

  const getView = () => {
    return (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate as any;
  };

  // The label should start off as not there

  expect(getView().label).toBe(undefined);

  (player.getState() as InProgressState).controllers.data.set([
    ['foo.type', 'valid'],
  ]);

  await waitFor(() =>
    expect(getView().label).toStrictEqual({
      asset: {
        id: 'label',
        type: 'text',
        value: 'view label',
      },
    })
  );

  (player.getState() as InProgressState).controllers.data.set([
    ['foo', { type: 'not-valid' }],
  ]);

  await waitFor(() => expect(getView().label).toBe(undefined));
});
