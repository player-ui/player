import { waitFor } from '@testing-library/react';
import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { makeFlow } from '@player-ui/make-flow';
import { Registry } from '@player-ui/partial-match-registry';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import type { FormatType } from '@player-ui/schema';
import type { Flow } from '@player-ui/types';
import { TypesProviderPlugin } from '.';

const inputTransformPlugin = new AssetTransformPlugin(
  new Registry([
    [
      { type: 'input' },
      (value, options) => {
        return {
          ...value,
          validation: options.validation?.get(value.binding, { track: true }),
          dataType: options.validation?.type(value.binding)?.type,
          set: (val: any) => {
            options.data.model.set([[value.binding, val]]);
          },
        };
      },
    ],
  ])
);

test('adds custom types', async () => {
  const flowWithCustomTypes = makeFlow({
    id: 'view-1',
    type: 'input',
    binding: 'foo.bar',
  });

  flowWithCustomTypes.schema = {
    ROOT: {
      foo: {
        type: 'FooType',
      },
    },
    FooType: {
      bar: {
        type: 'CustomType',
      },
    },
  };

  const player = new Player({
    plugins: [
      inputTransformPlugin,
      new TypesProviderPlugin({
        types: [
          {
            type: 'CustomType',
            validation: [
              {
                type: 'customValidation',
                props: 'stuff',
              },
            ],
          },
        ],
        validators: [
          [
            'customValidation',
            (context, value, options) => {
              if (value !== options.props) {
                return {
                  message: 'thats not good',
                };
              }
            },
          ],
        ],
      }),
    ],
  });
  player.start(flowWithCustomTypes);

  const getLastUpdate = () =>
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

  let input = getLastUpdate();
  expect(input?.dataType).toBe('CustomType');

  input?.set('not right');

  await waitFor(() => {
    input = getLastUpdate();
    expect(input?.validation.message).toBe('thats not good');
  });

  input?.set('stuff');

  await waitFor(() => {
    input = getLastUpdate();
    expect(input?.validation).toBe(undefined);
  });
});

describe('formatting', () => {
  const flowWithDataTypes: Flow = {
    id: 'tst',
    views: [],
    schema: {
      ROOT: {
        foo: {
          type: 'NumberType',
        },
      },
      NumberType: {
        num: {
          type: 'BaseType',
          format: {
            type: 'number',
            decimalPlaces: 2,
          },
          default: 500,
        },
      },
    },
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'EXT_1',
        EXT_1: {
          state_type: 'EXTERNAL',
          ref: 'wait',
          transitions: {},
        },
      },
    },
  };

  /** Quick formatter for a number -> string */
  const numberFormat: FormatType<
    number,
    string,
    {
      /** number of decimal place to preserve when converting to a string */
      decimalPlaces: number;
    }
  > = {
    name: 'number',
    format(val, options) {
      return typeof val === 'string'
        ? val
        : val.toFixed(options?.decimalPlaces);
    },
    deformat(val) {
      return typeof val === 'string' ? parseFloat(val) : val;
    },
  };

  test('it formats things', () => {
    const player = new Player({
      plugins: [
        new TypesProviderPlugin({
          formats: [numberFormat],
        }),
      ],
    });

    player.start({
      ...flowWithDataTypes,
      data: { foo: { num: 500 } },
    });
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.data.get('foo.num', { formatted: true })
    ).toStrictEqual('500.00');
  });

  test('it formats things with default types', () => {
    const player = new Player({
      plugins: [
        new TypesProviderPlugin({
          formats: [numberFormat],
        }),
      ],
    });

    player.start(flowWithDataTypes);
    const state = player.getState() as InProgressState;

    expect(
      state.controllers.data.get('foo.num', { formatted: true })
    ).toStrictEqual('500.00');
  });
});
