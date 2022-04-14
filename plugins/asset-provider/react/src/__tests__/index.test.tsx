import React from 'react';
import { WebPlayer } from '@player-ui/react';
import { AssetProviderPlugin } from '..';

/**
 *
 */
const DummyComp = () => <div>Test</div>;

test('loads entries into the web-player registry', () => {
  const wp = new WebPlayer({
    plugins: [
      new AssetProviderPlugin([
        ['test-string', DummyComp],
        [{ type: 'full-match' }, DummyComp],
      ]),
    ],
  });

  expect(wp.assetRegistry.get({ type: 'test-string' })).toBe(DummyComp);
  expect(wp.assetRegistry.get({ type: 'full-match' })).toBe(DummyComp);
});
