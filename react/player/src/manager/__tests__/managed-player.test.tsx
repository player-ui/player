import React, { Suspense } from 'react';
import { makeFlow } from '@player-ui/make-flow';
import {
  render,
  screen,
  act,
  configure,
  waitFor,
} from '@testing-library/react';
import {
  MetricsCorePlugin,
  RequestTimeWebPlugin,
} from '@player-ui/metrics-plugin';
import { ManagedPlayer } from '../managed-player';
import type { FlowManager, FallbackProps } from '../types';
import { SimpleAssetPlugin } from '../../__tests__/helpers/simple-asset-plugin';

jest.mock('@player-ui/metrics-plugin', () => ({
  ...(jest.requireActual('@player-ui/metrics-plugin') as []),
  RequestTimeWebPlugin: jest.fn().mockImplementation(() => {
    return { apply: jest.fn() };
  }),
}));

configure({ testIdAttribute: 'id' });

test('requestTime should be available', async () => {
  const manager: FlowManager = {
    next: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-1',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-2',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
        })
      )
      .mockReturnValue(Promise.resolve({ done: true })),
  };

  const onComplete = jest.fn();
  const onError = jest.fn();

  act(() => {
    render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin(), new MetricsCorePlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>
    );
  });

  expect(manager.next).toBeCalledWith(undefined);
  const view = await screen.findByTestId('flow-1');
  expect(view).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });

  expect(manager.next).toBeCalledTimes(2);

  const view2 = await screen.findByTestId('flow-2');
  expect(view2).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });
  const getRequestTime = (
    RequestTimeWebPlugin as jest.Mock<RequestTimeWebPlugin>
  ).mock.calls[0][0];
  expect(getRequestTime()).toBeDefined();
  expect(onComplete).toBeCalled();
});

test('handles dummy flows', async () => {
  const manager: FlowManager = {
    next: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-1',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          value: {
            ...makeFlow({
              id: 'flow-2',
              type: 'collection',
              values: [
                {
                  asset: {
                    id: 'action',
                    type: 'action',
                    value: 'Next',
                    label: 'Continue',
                  },
                },
              ],
            }),
            data: { foo: 'bar' },
          },
        })
      )
      .mockReturnValue(Promise.resolve({ done: true })),
  };

  const onComplete = jest.fn();
  const onError = jest.fn();

  act(() => {
    render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>
    );
  });

  expect(manager.next).toBeCalledWith(undefined);
  const view = await screen.findByTestId('flow-1');
  expect(view).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });

  expect(manager.next).toBeCalledTimes(2);

  const view2 = await screen.findByTestId('flow-2');
  expect(view2).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });
  expect(onComplete).toBeCalledWith(
    expect.objectContaining({
      status: 'completed',
      data: { foo: 'bar' },
    })
  );
});

test('handles FlowManager error', async () => {
  const manager: FlowManager = {
    next: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-1',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
        })
      )
      .mockImplementationOnce(() => {
        throw new Error();
      })
      .mockImplementationOnce(() => {
        throw new Error();
      })
      .mockReturnValue(Promise.resolve({ done: true })),
  };

  const onComplete = jest.fn();
  const onError = jest.fn();
  /**
   *
   */
  const MyFallback = (props: FallbackProps) => (
    <div>
      <button type="button" onClick={props?.retry}>
        Retry
      </button>
      <button type="button" onClick={props?.reset}>
        Reset
      </button>
    </div>
  );

  act(() => {
    render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          fallbackComponent={MyFallback}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>
    );
  });

  expect(manager.next).toBeCalledWith(undefined);
  const view = await screen.findByTestId('flow-1');
  expect(view).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });

  expect(manager.next).toBeCalledTimes(2);

  await act(async () => {
    const nextButton = await screen.findByText('Retry');
    nextButton.click();
  });

  expect(manager.next).toBeCalledTimes(3);

  await act(async () => {
    const nextButton = await screen.findByText('Reset');
    nextButton.click();
  });

  expect(manager.next).toBeCalledTimes(4);
  expect(onError).toBeCalledTimes(2);
  expect(onComplete).toBeCalled();
});

test('handles flow error', async () => {
  const manager: FlowManager = {
    next: jest
      .fn()
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-1',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-2',
            type: 'action',
            exp: 'err(',
            label: 'Error',
          }),
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          value: makeFlow({
            id: 'flow-2',
            type: 'action',
            exp: 'err(',
            label: 'Error',
          }),
        })
      )
      .mockReturnValue(Promise.resolve({ done: true })),
  };
  const onComplete = jest.fn();
  const onError = jest.fn();

  /**
   *
   */
  const MyFallback = (props: FallbackProps) => (
    <div>
      <button type="button" onClick={props?.retry}>
        Retry
      </button>
      <button type="button" onClick={props?.reset}>
        Reset
      </button>
    </div>
  );

  await act(async () => {
    render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          fallbackComponent={MyFallback}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>
    );
  });

  expect(manager.next).toBeCalledWith(undefined);
  const view = await screen.findByTestId('flow-1');
  expect(view).toBeInTheDocument();

  await act(async () => {
    const nextButton = await screen.findByText('Continue');
    nextButton.click();
  });

  await waitFor(() => expect(manager.next).toBeCalledTimes(2));

  const view2 = await screen.findByTestId('flow-2');
  expect(view2).toBeInTheDocument();

  await act(async () => {
    view2.click();
  });

  const retryButton = await screen.findByText('Retry');
  expect(retryButton).toBeInTheDocument();

  await act(async () => {
    retryButton.click();
  });

  expect(manager.next).toBeCalledTimes(3);

  const view3 = await screen.findByTestId('flow-2');
  expect(view3).toBeInTheDocument();

  await act(async () => {
    view3.click();
  });

  const resetButton = await screen.findByText('Retry');
  expect(resetButton).toBeInTheDocument();

  await act(async () => {
    resetButton.click();
  });

  expect(manager.next).toBeCalledTimes(4);
  expect(onError).toBeCalledTimes(2);

  expect(onComplete).toBeCalled();
});

test('handles terminating with data', async () => {
  jest.useRealTimers();
  const manager: FlowManager = {
    next: jest.fn().mockReturnValueOnce(
      Promise.resolve({
        value: {
          ...makeFlow({
            id: 'flow-1',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'action',
                  type: 'action',
                  value: 'Next',
                  label: 'Continue',
                },
              },
            ],
          }),
          data: {
            returns: { id: '123' },
          },
        },
      })
    ),
    terminate: jest.fn(),
  };

  const onComplete = jest.fn();
  const onError = jest.fn();

  let renderResult;
  act(() => {
    renderResult = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>
    );
  });

  await screen.findByTestId('flow-1');
  (renderResult as any).unmount();
  expect(manager.terminate).toBeCalledWith({ returns: { id: '123' } });
});
