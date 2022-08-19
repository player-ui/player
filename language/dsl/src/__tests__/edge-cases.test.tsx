import React from 'react';
import { render } from '..';
import { Collection, Input, Text } from './helpers/asset-library';

test('works with a Component that returns a Fragment of items', async () => {
  const NestedItems = () => {
    return (
      <>
        <Text>Before Input</Text>
        <Input />
        <Text>After Input</Text>
      </>
    );
  };

  const expected = {
    id: 'root',
    type: 'collection',
    values: [
      {
        asset: {
          id: 'values-0',
          type: 'text',
          value: 'Before Input',
        },
      },
      {
        asset: {
          id: 'values-1',
          type: 'input',
        },
      },
      {
        asset: {
          id: 'values-2',
          type: 'text',
          value: 'After Input',
        },
      },
    ],
  };

  const contentWithFragment = await render(
    <Collection>
      <Collection.Values>
        <NestedItems />
      </Collection.Values>
    </Collection>
  );

  expect(contentWithFragment.jsonValue).toStrictEqual(expected);

  const contentWithoutFragment = await render(
    <Collection>
      <Collection.Values>
        <Text>Before Input</Text>
        <Input />
        <Text>After Input</Text>
      </Collection.Values>
    </Collection>
  );

  expect(contentWithoutFragment.jsonValue).toStrictEqual(expected);
});
