import React from 'react';
import { WebPlayer } from '@player-ui/react';
import { findByTestId, render } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';
import { BeaconPlugin, useBeacon } from '..';

describe('beacon web plugin', () => {
  test('loads in a player', async () => {
    const beaconCallback = jest.fn();

    const wp = new WebPlayer({
      plugins: [
        new BeaconPlugin({
          callback: beaconCallback,
        }),
      ],
    });

    const flow = makeFlow({
      id: 'action',
      type: 'action',
      value: 'Next',
    });

    wp.assetRegistry.set({ type: 'action' }, (props: any) => {
      const beacon = useBeacon({ element: 'button' });

      beacon();

      return <div data-testid={props.id}>{props.value}</div>;
    });
    wp.start(flow);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <wp.Component />
        </React.Suspense>
      </div>
    );

    await findByTestId(container, 'action');

    expect(wp.player.getState().status).toBe('in-progress');

    expect(beaconCallback).toHaveBeenCalledTimes(1);
  });
});
