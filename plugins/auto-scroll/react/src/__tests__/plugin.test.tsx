import type { ComponentType } from 'react';
import React, { useLayoutEffect } from 'react';
import type { InProgressState } from '@player-ui/react';
import { ReactPlayer } from '@player-ui/react';

import { findByRole, render, waitFor } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';

import {
  actionTransform,
  inputTransform,
} from '@player-ui/reference-assets-plugin';
import { Info, Action, Input } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';

import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import {
  AutoScrollManagerPlugin,
  ScrollType,
  useRegisterAsScrollable,
} from '..';

jest.mock('smooth-scroll-into-view-if-needed');

/**
 * HOC to enable scrollable behavior for a given component
 *
 * - @param Component
 */
const withScrollable = (Component: ComponentType<any>) => {
  /**
   *
   */
  const ScrollableComponent = (props: any) => {
    const registerFunction = useRegisterAsScrollable();

    useLayoutEffect(() => {
      registerFunction({ type: ScrollType.ValidationError, ref: props.id });
    }, [props.validation]);

    return <Component {...props} />;
  };

  return ScrollableComponent;
};

describe('auto-scroll plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const flow = makeFlow({
    id: 'view-1',
    type: 'info',
    primaryInfo: {
      asset: {
        id: 'asset',
        type: 'input',
        binding: 'person.name',
      },
    },
    actions: [
      {
        asset: {
          id: 'action-auto-scroll',
          type: 'action',
          value: 'Next',
        },
      },
    ],
  });

  flow.schema = {
    ROOT: {
      person: {
        type: 'PersonType',
      },
    },
    PersonType: {
      name: {
        type: 'StringType',
        validation: [
          {
            type: 'required',
            message: 'Required',
          },
        ],
      },
    },
  };

  document.getElementById = (id: any) => {
    if (id === 'asset') {
      return {
        getAttribute: () => 'true',
        getBoundingClientRect: () => ({ top: 50 }),
      } as any;
    }

    return undefined;
  };

  test('scrolls successfully test', async () => {
    const wp = new ReactPlayer({
      plugins: [
        new AssetTransformPlugin([
          [{ type: 'action' }, actionTransform],
          [{ type: 'input' }, inputTransform],
        ]),
        new CommonTypesPlugin(),
        new AutoScrollManagerPlugin({
          autoFocusOnErrorField: true,
        }),
      ],
    });
    wp.assetRegistry.set({ type: 'info' }, Info);
    wp.assetRegistry.set({ type: 'action' }, Action);
    wp.assetRegistry.set({ type: 'input' }, withScrollable(Input));

    wp.start(flow as any);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <wp.Component />
        </React.Suspense>
      </div>
    );

    await waitFor(async () => {
      const action = await findByRole(container, 'button');
      action.click();
    });

    expect(scrollIntoView).toBeCalledTimes(1);
  });

  test('no error no scroll test', async () => {
    const wp = new ReactPlayer({
      plugins: [
        new AssetTransformPlugin([
          [{ type: 'action' }, actionTransform],
          [{ type: 'input' }, inputTransform],
        ]),
        new CommonTypesPlugin(),
        new AutoScrollManagerPlugin({
          autoFocusOnErrorField: true,
        }),
      ],
    });
    wp.assetRegistry.set({ type: 'info' }, Info);
    wp.assetRegistry.set({ type: 'action' }, Action);
    wp.assetRegistry.set({ type: 'input' }, withScrollable(Input));

    wp.start(flow as any);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <wp.Component />
        </React.Suspense>
      </div>
    );

    waitFor(async () => {
      const state = wp.player.getState() as InProgressState;
      state.controllers.data.set([['person.name', 'sam']]);
      const action = await findByRole(container, 'button');
      action.click();
    });

    expect(scrollIntoView).not.toBeCalled();
  });
});
