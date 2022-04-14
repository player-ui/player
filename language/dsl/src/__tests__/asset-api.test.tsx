import React from 'react';
import { render } from 'react-json-reconciler';
import { binding as b } from '../string-templates';
import { Switch } from '../switch';
import { Collection, Text, Input, ArrayProp } from './helpers/asset-library';

describe('components', () => {
  it('automatically creates collections', async () => {
    const element = (
      <Collection>
        <Collection.Label>
          <Text>Foo</Text>
          <Text>Bar</Text>
        </Collection.Label>
        <Collection.Values>
          <Text>Foo</Text>
          <Text>Bar</Text>
        </Collection.Values>
      </Collection>
    );

    expect(await render(element)).toStrictEqual({
      id: 'root',
      type: 'collection',
      label: {
        asset: {
          id: 'label',
          type: 'collection',
          values: [
            { asset: { id: 'label-values-0', type: 'text', value: 'Foo' } },
            { asset: { id: 'label-values-1', type: 'text', value: 'Bar' } },
          ],
        },
      },
      values: [
        { asset: { id: 'values-0', type: 'text', value: 'Foo' } },
        { asset: { id: 'values-1', type: 'text', value: 'Bar' } },
      ],
    });
  });

  it('automatically creates text assets', async () => {
    const element = (
      <Collection>
        <Collection.Label>Foo {b`bar`.toString()}</Collection.Label>
        <Collection.Values>
          <Text>Foo</Text>
          <Text>Bar</Text>
        </Collection.Values>
      </Collection>
    );

    expect(await render(element)).toStrictEqual({
      id: 'root',
      type: 'collection',
      label: {
        asset: {
          id: 'label',
          type: 'text',
          value: 'Foo {{bar}}',
        },
      },
      values: [
        { asset: { id: 'values-0', type: 'text', value: 'Foo' } },
        { asset: { id: 'values-1', type: 'text', value: 'Bar' } },
      ],
    });
  });

  it('works with fragments', async () => {
    const element = (
      <Collection>
        <Collection.Label>
          <Text>Label</Text>
        </Collection.Label>
        <Collection.Values>
          <>
            <Text>Foo</Text>
            <Text>Bar</Text>
            <>
              <Text>Foo</Text>
              <Text>Bar</Text>
            </>
          </>
          <Text value="value-4" />
        </Collection.Values>
      </Collection>
    );

    expect(await render(element)).toStrictEqual({
      id: 'root',
      type: 'collection',
      label: { asset: { id: 'label', type: 'text', value: 'Label' } },
      values: [
        {
          asset: {
            id: 'values-0',
            type: 'text',
            value: 'Foo',
          },
        },
        {
          asset: {
            id: 'values-1',
            type: 'text',
            value: 'Bar',
          },
        },
        {
          asset: {
            id: 'values-2',
            type: 'text',
            value: 'Foo',
          },
        },
        {
          asset: {
            id: 'values-3',
            type: 'text',
            value: 'Bar',
          },
        },
        {
          asset: {
            id: 'values-4',
            type: 'text',
            value: 'value-4',
          },
        },
      ],
    });
  });

  describe('custom text modifier component', () => {
    it('works with refs and layout effects', async () => {
      const element = await render(
        <Text>
          Foo{' '}
          <Text.Modifier value="important" type="tag">
            Bar
          </Text.Modifier>
        </Text>
      );

      expect(element).toMatchInlineSnapshot(`
        Object {
          "id": "root",
          "modifiers": Array [
            Object {
              "name": "M0",
              "type": "tag",
              "value": "important",
            },
          ],
          "type": "text",
          "value": "Foo [[M0]]Bar[[/M0]]",
        }
      `);
    });
  });

  describe('bindings', () => {
    it('converts just a binding node into a ref', async () => {
      const element = await render(<Text>{b`foo.bar`.toString()}</Text>);

      expect(element).toStrictEqual({
        id: 'root',
        type: 'text',
        value: '{{foo.bar}}',
      });
    });

    it('converts a text string into refs', async () => {
      const element = await render(
        <Text>Label {b`foo.bar`.toString()} End</Text>
      );

      expect(element).toStrictEqual({
        id: 'root',
        type: 'text',
        value: 'Label {{foo.bar}} End',
      });
    });

    it('leaves bindings for expected props', async () => {
      const element = await render(
        <Input binding={b`foo.bar.baz`}>
          <Input.Label>Input Label</Input.Label>
        </Input>
      );

      expect(element).toStrictEqual({
        id: 'root',
        type: 'input',
        binding: 'foo.bar.baz',
        label: {
          asset: {
            type: 'text',
            id: 'label',
            value: 'Input Label',
          },
        },
      });
    });
  });

  describe('applicability', () => {
    test('works with applicability prop', async () => {
      const element = await render(
        <Input id="custom-id" applicability={b`foo.bar.baz`}>
          <Input.Label>Input Label</Input.Label>
        </Input>
      );

      expect(element).toStrictEqual({
        id: 'custom-id',
        type: 'input',
        applicability: '{{foo.bar.baz}}',
        label: {
          asset: {
            type: 'text',
            id: 'custom-id-label',
            value: 'Input Label',
          },
        },
      });
    });

    test('works for boolean literals', async () => {
      const element = await render(
        <Input id="custom-id" applicability={false}>
          <Input.Label>Input Label</Input.Label>
        </Input>
      );

      expect(element).toStrictEqual({
        id: 'custom-id',
        type: 'input',
        applicability: false,
        label: {
          asset: {
            type: 'text',
            id: 'custom-id-label',
            value: 'Input Label',
          },
        },
      });
    });
  });

  it('auto-id', async () => {
    const element = (
      <Collection id="first-thing">
        <Collection.Label>Text</Collection.Label>
      </Collection>
    );

    expect(await render(element)).toStrictEqual({
      id: 'first-thing',
      type: 'collection',
      label: {
        asset: {
          type: 'text',
          id: 'first-thing-label',
          value: 'Text',
        },
      },
    });
  });

  it('should allow for a binding-ref on any leaf property', async () => {
    const element = (
      <ArrayProp
        stuff={[]}
        optionalNumber={b`foo.bar`}
        metaData={{
          optionalUnion: {
            other: b`foo`,
          },
        }}
      />
    );

    expect(await render(element)).toStrictEqual({
      id: 'root',
      metaData: {
        optionalUnion: {
          other: '{{foo}}',
        },
      },
      optionalNumber: '{{foo.bar}}',
      stuff: [],
      type: 'assetWithArray',
    });
  });
});

describe('allows other props to be added to a slot', () => {
  it('works with asset children', async () => {
    const element = await render(
      <Input id="custom-id">
        <Input.Label customLabelProp="custom label slot value">
          Input Label
        </Input.Label>
      </Input>
    );

    expect(element).toStrictEqual({
      id: 'custom-id',
      type: 'input',
      label: {
        customLabelProp: 'custom label slot value',
        asset: {
          type: 'text',
          id: 'custom-id-label',
          value: 'Input Label',
        },
      },
    });
  });

  it('works with switch children', async () => {
    const element = await render(
      <Input id="custom-id">
        <Input.Label customLabelProp="custom label slot value">
          <Switch>
            <Switch.Case>
              <Text>Test</Text>
            </Switch.Case>
          </Switch>
        </Input.Label>
      </Input>
    );

    expect(element).toStrictEqual({
      id: 'custom-id',
      type: 'input',
      label: {
        customLabelProp: 'custom label slot value',
        staticSwitch: [
          {
            asset: {
              type: 'text',
              id: 'custom-id-label-staticSwitch-0',
              value: 'Test',
            },
            case: true,
          },
        ],
      },
    });
  });
});
