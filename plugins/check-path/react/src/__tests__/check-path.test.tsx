import React from 'react';
import { Asset } from '@player-ui/react-asset';
import { WebPlayer } from '@player-ui/react';
import { findByTestId, render } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';
import { CheckPathPlugin, useGetParentProp } from '..';

describe('beacon web plugin', () => {
  test('loads in a player', async () => {
    const wp = new WebPlayer({
      plugins: [new CheckPathPlugin()],
    });

    const flow = makeFlow({
      id: 'action',
      type: 'action',
      value: 'Next',
      label: {
        asset: {
          type: 'action',
          id: 'label',
        },
      },
    });

    wp.assetRegistry.set({ type: 'action' }, (props: any) => {
      const parentProp = useGetParentProp(props.id);

      return (
        <div data-testid={props.id}>
          {props.value} - {parentProp}
          {props.label && <Asset {...props.label} />}
        </div>
      );
    });
    wp.start(flow);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <wp.Component />
        </React.Suspense>
      </div>
    );

    const action = await findByTestId(container, 'action');

    expect(action).toMatchInlineSnapshot(`
      <div
        data-testid="action"
      >
        Next
         - 
        <div
          data-testid="label"
        >
           - 
          label
        </div>
      </div>
    `);
  });
});
