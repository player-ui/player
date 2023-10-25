import React from 'react';
import { render } from '@testing-library/react';
import { Registry } from '@player-ui/partial-match-registry';
import type { Asset as AssetType } from '@player-ui/player';
import type { AssetRegistryType } from '..';
import { ReactAsset, AssetContext } from '..';

test('it prioritizes local type and id', () => {
  const assetDef = {
    id: 'foo',
    type: 'foo',
    asset: {
      id: 'bar',
      type: 'bar',
    },
  };

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
    [{ type: 'bar' }, () => <div>bar</div>],
  ]);

  const asset = render(
    <AssetContext.Provider value={{ registry }}>
      <ReactAsset {...assetDef} />
    </AssetContext.Provider>
  );

  expect(asset.getByText('foo')).not.toBeUndefined();
});

test('throws an error for an asset missing implementation', () => {
  const assetDef = {
    asset: {
      id: 'bar-id',
      type: 'bar',
    },
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>
    )
  ).toThrowError('No implementation found for id: bar-id type: bar');
});

test('throws an error for an asset missing type', () => {
  const assetDef = {
    asset: {
      id: 'bar-id',
    },
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
    [{ type: 'bar' }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>
    )
  ).toThrowError('Asset is missing type for id: bar-id');
});

test('throws an error for an asset that isnt an object', () => {
  const assetDef = {
    asset: 'bar',
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
    [{ type: 'bar' }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>
    )
  ).toThrowError('Asset was not an object got (string) instead: bar');
});

test('throws an error for an asset that is an object but not valid', () => {
  const assetDef = {
    asset: ['a'],
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
    [{ type: 'bar' }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>
    )
  ).toThrowError('Asset is missing type for {"asset":["a"]}');
});
test('throws an error for an asset that unwraps nothing', () => {
  const assetDef = {
    asset: undefined,
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: 'foo' }, () => <div>foo</div>],
    [{ type: 'bar' }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>
    )
  ).toThrowError('Cannot determine asset type for props: {}');
});
