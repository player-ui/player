import React from 'react';
import { render } from 'react-json-reconciler';
import { binding as b, expression as e } from '..';
import { Switch } from '../../switch';
import { Collection } from '../../__tests__/helpers/asset-library';

test('can be used as a react child element', async () => {
  const content = await render(
    <object>
      <property name="expression">{e`test()`}</property>
      <property name="binding">{b`foo.bar`}</property>
    </object>
  );

  expect(content).toStrictEqual({
    expression: '@[test()]@',
    binding: '{{foo.bar}}',
  });
});

test('Works when used as a child asset', async () => {
  const content = await render(
    <Collection>
      <Collection.Label>{b`foo.bar`}</Collection.Label>
    </Collection>
  );

  expect(content).toStrictEqual({
    id: 'root',
    type: 'collection',
    label: {
      asset: {
        id: 'label',
        type: 'text',
        value: '{{foo.bar}}',
      },
    },
  });
});

test('Works as a switch child', async () => {
  const content = await render(
    <Collection>
      <Collection.Label>
        <Switch>
          <Switch.Case>Testing 123 {b`foo.bar`}</Switch.Case>
        </Switch>
      </Collection.Label>
    </Collection>
  );

  expect(content).toStrictEqual({
    id: 'root',
    type: 'collection',
    label: {
      staticSwitch: [
        {
          case: true,
          asset: {
            id: 'label-staticSwitch-0',
            type: 'text',
            value: 'Testing 123 {{foo.bar}}',
          },
        },
      ],
    },
  });
});
