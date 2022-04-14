import { waitFor } from '@testing-library/react';
import type { Flow } from '@player-ui/types';
import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { ConstantsPlugin } from '..';

test('basic value overriding', async () => {
  const flow: Flow = makeFlow({
    id: 'view-1',
    type: 'view',
    thing1: {
      asset: {
        id: 'input-1',
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
            type: 'length',
            max: 20,
            min: 5,
          },
          {
            type: 'string',
          },
        ],
      },
    },
  };

  flow.data = {
    constants: {
      validation: {
        length: {
          maximum: 'This should be returned',
        },
      },
    },
  };

  const constantsData = {
    validation: {
      length: {
        minimum: 'Way to short',
        maximum: 'This should not be returned',
      },
    },
  };

  const pluginConfig = {
    data: constantsData,
    namespace: 'constants',
    dataPath: 'data.constants',
  };
  const player = new Player({
    plugins: [new CommonTypesPlugin(), new ConstantsPlugin(pluginConfig)],
  });

  // Add tap to get validation information
  player.hooks.viewController.tap('test', (vc) => {
    vc.hooks.view.tap('test', (view) => {
      view.hooks.resolver.tap('test', (resolver) => {
        resolver.hooks.resolve.tap('test', (val, node, options) => {
          if (val?.binding) {
            options.validation?.track(val.binding);
            const valObj = options.validation?.get(val.binding);

            if (valObj) {
              return {
                ...val,
                validation: valObj,
                allValidations: options.validation?.getAll(),
              };
            }
          }

          return val;
        });
      });
    });
  });

  player.start(flow);
  let state = player.getState() as InProgressState;

  /** Start of Tests */

  // Test default error message
  state.controllers.data.set([['person.name', 0]]);
  expect(state.controllers.data.get('person.name')).toBe('');
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
        .message
    ).toBe('Value must be a string')
  );

  // Test error message set in constants plugin
  state.controllers.data.set([['person.name', 'adam']]);
  expect(state.controllers.data.get('person.name')).toBe('');
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
        .message
    ).toBe('Way to short')
  );

  // Test error message set in constants plugin but overridden in content
  state.controllers.data.set([
    [
      'person.name',
      'This is a really long name, like a really long name. Who would have a name this long',
    ],
  ]);
  expect(state.controllers.data.get('person.name')).toBe('');
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
        .message
    ).toBe('This should be returned')
  );

  // Restart Player and clear content data to make sure expected error messsage is returned

  flow.data = {};
  player.start(flow);
  state = player.getState() as InProgressState;

  // Make sure temp error message is reset
  state.controllers.data.set([
    ['person.name', 'Superlongnamethatisovertwentycharacters'],
  ]);
  expect(state.controllers.data.get('person.name')).toBe('');
  await waitFor(() =>
    expect(
      state.controllers.view.currentView?.lastUpdate?.thing1.asset.validation
        .message
    ).toBe('This should not be returned')
  );
});

describe('can get and update constants', () => {
  const flow: Flow = makeFlow({
    id: 'view-1',
    type: 'view',
  });

  test('can get all constants for namespace', () => {
    const data = { one: 1 };
    const plugin = new ConstantsPlugin({ data, namespace: 'test' });

    expect(plugin.getConstants()).toStrictEqual(data);
  });

  test('can get initial data', () => {
    const plugin = new ConstantsPlugin({ data: { one: 1 }, namespace: 'test' });
    const player = new Player({ plugins: [plugin] });

    expect(player.constantsController.getConstants('one', 'test')).toBe(1);
  });

  test('can update data after instantiation', () => {
    const plugin = new ConstantsPlugin({ data: { one: 1 }, namespace: 'test' });
    const player = new Player({ plugins: [plugin] });

    plugin.setConstants({ one: 2 });

    player.start(flow);

    expect(player.constantsController.getConstants('one', 'test')).toBe(2);
  });

  test('updates constants for multiple players', () => {
    const plugin = new ConstantsPlugin({ data: { one: 1 }, namespace: 'test' });
    const player1 = new Player({ plugins: [plugin] });
    const player2 = new Player({ plugins: [plugin] });

    plugin.setConstants({ one: 2 });

    player1.start(flow);
    player2.start(flow);

    expect(player1.constantsController.getConstants('one', 'test')).toBe(2);
    expect(player2.constantsController.getConstants('one', 'test')).toBe(2);
  });
});
