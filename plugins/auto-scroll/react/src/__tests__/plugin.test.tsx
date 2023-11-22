import type { ComponentType } from 'react';
import React, { useLayoutEffect } from 'react';
import type { InProgressState } from '@player-ui/react';
import { ReactPlayer } from '@player-ui/react';

import { findByRole, render, waitFor, act } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';

import {
  actionTransform,
  inputTransform,
  infoTransform,
} from '@player-ui/reference-assets-plugin';
import { Info, Action, Input } from '@player-ui/reference-assets-plugin-react';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';

import scrollIntoViewWithOffset from '../scrollIntoViewWithOffset';

import {
  AutoScrollManagerPlugin,
  ScrollType,
  useRegisterAsScrollable,
} from '..';

jest.mock('../scrollIntoViewWithOffset');

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
          [{ type: 'info' }, infoTransform],
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

    expect(scrollIntoViewWithOffset).toBeCalledTimes(1);
  });

  test('works with custom base element and offset', async () => {
    const getBaseElementMock = vitest.fn();

    const wp = new ReactPlayer({
      plugins: [
        new AssetTransformPlugin([
          [{ type: 'action' }, actionTransform],
          [{ type: 'input' }, inputTransform],
          [{ type: 'info' }, infoTransform],
        ]),
        new CommonTypesPlugin(),
        new AutoScrollManagerPlugin({
          autoFocusOnErrorField: true,
          getBaseElement: getBaseElementMock,
          offset: 40,
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
    await act(() => waitFor(() => {}));

    getBaseElementMock.mockReturnValue({ id: 'view' });

    const action = await findByRole(container, 'button');
    act(() => action.click());
    await act(() => waitFor(() => {}));

    expect(scrollIntoViewWithOffset).toBeCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'view' }),
      40
    );

    // Mock the case where the base element can't be found, so document.body is used as a fallback
    getBaseElementMock.mockReturnValue(null);

    act(() => action.click());
    await act(() => waitFor(() => {}));

    expect(scrollIntoViewWithOffset).toHaveBeenLastCalledWith(
      expect.anything(),
      document.body,
      40
    );
  });

  test('works without custom base element and offset provided', async () => {
    const getBaseElementMock = vitest.fn();

    const wp = new ReactPlayer({
      plugins: [
        new AssetTransformPlugin([
          [{ type: 'action' }, actionTransform],
          [{ type: 'input' }, inputTransform],
          [{ type: 'info' }, infoTransform],
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
    await act(() => waitFor(() => {}));

    getBaseElementMock.mockReturnValue({ id: 'view' });

    const action = await findByRole(container, 'button');
    act(() => action.click());
    await act(() => waitFor(() => {}));

    expect(scrollIntoViewWithOffset).toBeCalledWith(
      expect.anything(),
      document.body,
      0
    );
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

    expect(scrollIntoViewWithOffset).not.toBeCalled();
  });
});

describe('getFirstScrollableElement unit tests', () => {
  const defineGetElementId = (bcrValues: any[]) => {
    return (idIn: string): HTMLElement | null => {
      switch (idIn) {
        case 'Element1':
          return {
            getAttribute: (attrIn) =>
              attrIn === 'aria-invalid' ? 'true' : 'false',
            getBoundingClientRect: () => bcrValues[0],
          } as HTMLElement;
        case 'Element2':
          return {
            getAttribute: (attrIn) =>
              attrIn === 'aria-invalid' ? 'true' : 'false',
            getBoundingClientRect: () => bcrValues[1],
          } as HTMLElement;
        case 'Element3':
          return {
            getAttribute: (attrIn) =>
              attrIn === 'aria-invalid' ? 'true' : 'false',
            getBoundingClientRect: () => bcrValues[2],
          } as HTMLElement;
        default:
          return null;
      }
    };
  };

  let autoScroll: AutoScrollManagerPlugin;
  let idList: Set<string>;

  beforeEach(() => {
    autoScroll = new AutoScrollManagerPlugin({});
    idList = new Set<string>();
    idList.add('Element1');
    idList.add('Element2');
    idList.add('Element3');
  });

  test('scrolled past all elements', () => {
    document.getElementById = defineGetElementId([
      {
        top: -30,
      },
      {
        top: -20,
      },
      {
        top: -10,
      },
    ]);

    expect(
      autoScroll.getFirstScrollableElement(idList, ScrollType.ValidationError)
    ).toBe('Element1');
  });

  test('scrolled past some of elements', () => {
    document.getElementById = defineGetElementId([
      {
        top: -20,
      },
      {
        top: -10,
      },
      {
        top: 0,
      },
    ]);

    expect(
      autoScroll.getFirstScrollableElement(idList, ScrollType.ValidationError)
    ).toBe('Element1');
  });

  test('all elements in view', () => {
    document.getElementById = defineGetElementId([
      {
        top: 10,
      },
      {
        top: 20,
      },
      {
        top: 30,
      },
    ]);

    expect(
      autoScroll.getFirstScrollableElement(idList, ScrollType.ValidationError)
    ).toBe('Element1');
  });

  test('all elements in view and target is 0', () => {
    document.getElementById = defineGetElementId([
      {
        top: 0,
      },
      {
        top: 10,
      },
      {
        top: 20,
      },
    ]);

    expect(
      autoScroll.getFirstScrollableElement(idList, ScrollType.ValidationError)
    ).toBe('Element1');
  });

  test('all elements in view but there is a tie', () => {
    document.getElementById = defineGetElementId([
      {
        top: 10,
      },
      {
        top: 10,
      },
      {
        top: 20,
      },
    ]);

    expect(
      autoScroll.getFirstScrollableElement(idList, ScrollType.ValidationError)
    ).toBe('Element1');
  });
});
