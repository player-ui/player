import React from 'react';
import { ReactPlayer, ReactAsset } from '@player-ui/react';
import { findByTestId, render } from '@testing-library/react';
import { makeFlow } from '@player-ui/make-flow';
import {
  CheckPathPlugin,
  useGetParent,
  useGetParentProp,
  useGetPath,
  useHasChildContext,
  useHasParentContext,
} from '..';

describe('beacon web plugin', () => {
  test('loads in a player', async () => {
    const rp = new ReactPlayer({
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

    rp.assetRegistry.set({ type: 'action' }, (props: any) => {
      const parentProp = useGetParentProp(props.id);

      return (
        <div data-testid={props.id}>
          {props.value} - {parentProp}
          {props.label && <ReactAsset {...props.label} />}
        </div>
      );
    });
    rp.start(flow);

    const { container } = render(
      <div>
        <React.Suspense fallback="loading...">
          <rp.Component />
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

describe('check-path tests', () => {
  const spy = jest.spyOn(React, 'useContext');
  const hasParentContextMock = jest.fn();
  const hasChildContextMock = jest.fn();
  const getParentPropMock = jest.fn();
  const getPathMock = jest.fn();
  const getParentMock = jest.fn();

  beforeEach(() => {
    spy.mockReturnValue({
      plugin: {
        hasParentContext: hasParentContextMock,
        hasChildContext: hasChildContextMock,
        getParentProp: getParentPropMock,
        getPath: getPathMock,
        getParent: getParentMock,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * useHasParent tests
   */

  test('useHasParentContext undefined asset', () => {
    expect(useHasParentContext(undefined, 'query')).toBe(false);
    expect(hasParentContextMock).not.toBeCalled();
  });

  test('useHasParentContext string asset', () => {
    useHasParentContext('testId', 'query');
    expect(hasParentContextMock).toBeCalled();
  });

  test('useHasParentContext object asset', () => {
    useHasParentContext({ id: 'testId', type: 'testType' }, 'query');
    expect(hasParentContextMock).toBeCalled();
  });

  /**
   * useHasChildContext tests
   */

  test('useHasChildContext undefined asset', () => {
    expect(useHasChildContext(undefined, 'query')).toBe(false);
    expect(hasChildContextMock).not.toBeCalled();
  });

  test('useHasChildContext string asset', () => {
    useHasChildContext('testId', 'query');
    expect(hasChildContextMock).toBeCalled();
  });

  test('useHasChildContext object asset', () => {
    useHasChildContext({ id: 'testId', type: 'testType' }, 'query');
    expect(hasChildContextMock).toBeCalled();
  });

  /**
   * useGetParentProp tests
   */

  test('useGetParentProp undefined asset', () => {
    expect(useGetParentProp(undefined)).toBe(undefined);
    expect(getParentPropMock).not.toBeCalled();
  });

  test('useGetParentProp string asset', () => {
    useGetParentProp('testId');
    expect(getParentPropMock).toBeCalled();
  });

  test('useGetParentProp object asset', () => {
    useGetParentProp({ id: 'testId', type: 'testType' });
    expect(getParentPropMock).toBeCalled();
  });

  /**
   * useGetPath tests
   */

  test('useGetPath undefined asset', () => {
    expect(useGetPath(undefined, 'query')).toBe(undefined);
    expect(getPathMock).not.toBeCalled();
  });

  test('useGetPath string asset', () => {
    useGetPath('testId', 'query');
    expect(getPathMock).toBeCalled();
  });

  test('useGetPath object asset', () => {
    useGetPath({ id: 'testId', type: 'testType' }, 'query');
    expect(getPathMock).toBeCalled();
  });

  /**
   * useGetParent tests
   */

  test('useGetParent undefined asset', () => {
    expect(useGetParent(undefined, 'query')).toBe(undefined);
    expect(getParentMock).not.toBeCalled();
  });

  test('useGetParent string asset', () => {
    useGetParent('testId', 'query');
    expect(getParentMock).toBeCalled();
  });

  test('useGetParent object asset', () => {
    useGetParent({ id: 'testId', type: 'testType' }, 'query');
    expect(getParentMock).toBeCalled();
  });
});
