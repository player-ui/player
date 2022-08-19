import React from 'react';
import { render } from 'react-json-reconciler';
import { toJsonProperties } from '../utils';
import { ArrayProp, Collection, Text } from './helpers/asset-library';
import { binding as b, expression as e } from '..';

const expectedBasicCollection = {
  id: 'root',
  type: 'collection',
  label: { asset: { id: 'label', type: 'text', value: 'Label' } },
  values: [
    {
      asset: {
        id: 'values-0',
        type: 'text',
        value: 'value-1',
      },
    },
    {
      asset: {
        id: 'values-1',
        type: 'text',
        value: 'value-2',
      },
    },
  ],
};

const expectedTemplateInstanceObjects = {
  page_experience: '@[foo.bar.GetDataResult]@',
  request_uuid: '{{foo.bar.UUID}}',
};

it('works with JSX', async () => {
  const element = (
    <Collection>
      <Collection.Label>
        <Text>Label</Text>
      </Collection.Label>
      <Collection.Values>
        <Text>value-1</Text>
        <Text value="value-2" />
      </Collection.Values>
    </Collection>
  );

  expect((await render(element)).jsonValue).toStrictEqual(
    expectedBasicCollection
  );
});

it('works for any json props', async () => {
  const testObj = {
    foo: false,
    bar: true,
    other: '',
  };
  expect(
    (await render(<object>{toJsonProperties(testObj)}</object>)).jsonValue
  ).toStrictEqual(testObj);
});

it('works for BindingTemplateInstances and ExpressionTemplateInstances', async () => {
  const testObj = {
    request_uuid: b`foo.bar.UUID`,
    page_experience: e`foo.bar.GetDataResult`,
  };
  expect(
    (await render(<object>{toJsonProperties(testObj)}</object>)).jsonValue
  ).toStrictEqual(expectedTemplateInstanceObjects);
});

it('handles array props', async () => {
  const expected = {
    id: 'root',
    type: 'assetWithArray',
    stuff: [{ id: '1' }, { id: '2' }],
  };

  const things = [{ id: '1' }, { id: '2' }];

  const element = <ArrayProp stuff={things} />;

  expect((await render(element)).jsonValue).toStrictEqual(expected);
});

test('flattens fragments', async () => {
  const element = (
    <Collection>
      <>
        <Collection.Label>
          <Text>Label</Text>
        </Collection.Label>
        <Collection.Values>
          <>
            <Text>value-1</Text>
            <Text value="value-2" />
          </>
        </Collection.Values>
      </>
    </Collection>
  );

  expect((await render(element)).jsonValue).toStrictEqual(
    expectedBasicCollection
  );
});
