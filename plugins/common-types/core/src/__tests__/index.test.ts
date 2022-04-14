import { waitFor } from '@testing-library/react';
import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { makeFlow } from '@player-ui/make-flow';
import { Registry } from '@player-ui/partial-match-registry';
import { CommonTypesPlugin } from '..';

const basicInputTransform = new AssetTransformPlugin(
  new Registry([
    [
      { type: 'input' },
      (value, options) => {
        return {
          ...value,
          value: options.data.model.get(value.binding, { formatted: true }),
          format: (newVal: any) => {
            return options.data.format(value.binding, newVal);
          },
          set: (newVal: any) => {
            return options.data.model.set([[value.binding, newVal]], {
              formatted: true,
            });
          },
          validation: options.validation?.get(value.binding, { track: true }),
        };
      },
    ],
  ])
);

test('works in real life', async () => {
  const flow = makeFlow({
    id: 'view-1',
    type: 'info',
    fields: {
      asset: {
        id: 'input-1',
        type: 'input',
        binding: 'person.age',
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
      age: {
        type: 'IntegerType',
        validation: [
          {
            type: 'required',
          },
        ],
      },
    },
  };

  const player = new Player({
    plugins: [basicInputTransform, new CommonTypesPlugin()],
  });

  player.start(flow);

  function getInputAsset() {
    return (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate?.fields.asset;
  }

  expect(getInputAsset().validation).toBe(undefined);

  getInputAsset().set('50.1');

  await waitFor(() => expect(getInputAsset().value).toBe('50'));
  expect(
    (player.getState() as InProgressState).controllers.data.get('person.age')
  ).toBe(50);
});

test('works with default values', () => {
  const flow = makeFlow({
    id: 'view-1',
    type: 'info',
    fields: {
      asset: {
        id: 'input-1',
        type: 'input',
        binding: 'person.checkbox',
      },
    },
    other: {
      asset: {
        id: 'input-2',
        type: 'input',
        binding: 'person.checkboxDefaultTrue',
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
      checkbox: {
        type: 'BooleanType',
      },
      checkboxDefaultTrue: {
        type: 'BooleanType',
        default: true,
      },
    },
  };

  const player = new Player({
    plugins: [basicInputTransform, new CommonTypesPlugin()],
  });

  player.start(flow);

  expect(
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate?.fields.asset.value
  ).toBe(false);

  expect(
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate?.other.asset.value
  ).toBe(true);
});

test('works with cross-field validation', async () => {
  const flow = makeFlow({
    id: 'view-1',
    type: 'info',
    fields: {
      asset: {
        id: 'input',
        type: 'input',
        binding: 'choice1',
      },
    },
    validation: [
      {
        ref: 'choice1',
        type: 'expression',
        exp: '{{choice1}} == "Adam"',
        message: 'Adam is always the right option',
        trigger: 'navigation',
      },
    ],
  });

  const player = new Player({
    plugins: [new CommonTypesPlugin(), basicInputTransform],
  });

  const result = player.start(flow);

  /**
   *
   */
  function getState() {
    return player.getState() as InProgressState;
  }

  /**
   *
   */
  function getInputAsset() {
    return getState().controllers.view.currentView?.lastUpdate?.fields.asset;
  }

  expect(getInputAsset().validation).toBe(undefined);

  getState().controllers.flow.transition('Next');
  expect(getInputAsset().validation).toMatchObject({
    severity: 'error',
    message: 'Adam is always the right option',
    displayTarget: 'field',
  });

  getInputAsset().set('Adam');
  await waitFor(() => expect(getInputAsset().validation).toBe(undefined));
  getState().controllers.flow.transition('Next');

  const completed = await result;
  expect(completed.data.choice1).toBe('Adam');
  expect(player.getState().status).toBe('completed');
});
