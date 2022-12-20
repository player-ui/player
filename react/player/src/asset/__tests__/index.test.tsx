import React from 'react';
import { render } from '@testing-library/react';
import { Registry } from '@player-ui/partial-match-registry';
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
