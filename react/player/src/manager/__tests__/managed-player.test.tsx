import { test, expect, vitest, describe, beforeEach } from "vitest";
import React, { Suspense } from "react";
import { makeFlow } from "@player-ui/make-flow";
import {
  render,
  act,
  configure,
  waitFor,
  screen,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  MetricsCorePlugin,
  RequestTimeWebPlugin,
} from "@player-ui/metrics-plugin";
import { ManagedPlayer } from "../managed-player";
import type { FlowManager, FallbackProps } from "../types";
import { SimpleAssetPlugin } from "../../__tests__/helpers/simple-asset-plugin";

vitest.mock("@player-ui/metrics-plugin", async () => {
  const actual: object = await vitest.importActual("@player-ui/metrics-plugin");

  return {
    ...actual,
    RequestTimeWebPlugin: vitest.fn().mockImplementation(() => {
      return { apply: vitest.fn() };
    }),
  };
});

configure({ testIdAttribute: "id" });

describe.each([
  { legacyRoot: true, version: 17 },
  { legacyRoot: false, version: 18 },
])("ManagedPlayer with React $version", ({ legacyRoot }) => {
  beforeEach(() => {
    vitest.clearAllMocks();
  });

  test("requestTime should be available", async () => {
    const manager: FlowManager = {
      next: vitest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-1",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-2",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
          }),
        )
        .mockReturnValue(Promise.resolve({ done: true })),
    };

    const onComplete = vitest.fn();
    const onError = vitest.fn();

    const container = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin(), new MetricsCorePlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>,
      { legacyRoot },
    );

    expect(manager.next).toBeCalledWith(undefined);
    const view = await container.findByTestId("flow-1");
    expect(view).toBeInTheDocument();

    await act(async () => {
      const nextButton = await container.findByText("Continue");
      nextButton.click();
    });

    expect(manager.next).toBeCalledTimes(2);

    const view2 = await container.findByTestId("flow-2");
    expect(view2).toBeInTheDocument();

    await act(async () => {
      const nextButton = await container.findByText("Continue");
      nextButton.click();
    });
    const getRequestTime = (RequestTimeWebPlugin as any).mock.calls[0][0];
    expect(getRequestTime()).toBeDefined();
    expect(onComplete).toBeCalled();
  });

  test("handles dummy flows", async () => {
    const manager: FlowManager = {
      next: vitest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-1",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            value: {
              ...makeFlow({
                id: "flow-2",
                type: "collection",
                values: [
                  {
                    asset: {
                      id: "action",
                      type: "action",
                      value: "Next",
                      label: "Continue",
                    },
                  },
                ],
              }),
              data: { foo: "bar" },
            },
          }),
        )
        .mockReturnValue(Promise.resolve({ done: true })),
    };

    const onComplete = vitest.fn();
    const onError = vitest.fn();

    const screen = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>,
      { legacyRoot },
    );

    expect(manager.next).toBeCalledWith(undefined);
    const view = await screen.findByTestId("flow-1");
    expect(view).toBeInTheDocument();

    await act(async () => {
      const nextButton = await screen.findByText("Continue");
      nextButton.click();
    });

    expect(manager.next).toBeCalledTimes(2);

    const view2 = await screen.findByTestId("flow-2");
    expect(view2).toBeInTheDocument();

    await act(async () => {
      const nextButton = await screen.findByText("Continue");
      nextButton.click();
    });
    expect(onComplete).toBeCalledWith(
      expect.objectContaining({
        status: "completed",
        data: { foo: "bar" },
      }),
    );
  });

  test("handles FlowManager error", async () => {
    const user = userEvent.setup();
    const manager: FlowManager = {
      next: vitest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-1",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
          }),
        )
        .mockImplementationOnce(() => {
          throw new Error();
        })
        .mockImplementationOnce(() => {
          throw new Error();
        })
        .mockReturnValue(Promise.resolve({ done: true })),
    };

    const onComplete = vitest.fn();
    const onError = vitest.fn();
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

    const screen = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          fallbackComponent={MyFallback}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>,
      { legacyRoot },
    );

    expect(manager.next).toBeCalledWith(undefined);
    const view = await screen.findByTestId("flow-1");
    expect(view).toBeInTheDocument();

    let nextButton = await screen.findByText("Continue");
    await user.click(nextButton);

    expect(manager.next).toBeCalledTimes(2);

    nextButton = await screen.findByText("Retry");
    await user.click(nextButton);

    expect(manager.next).toBeCalledTimes(3);

    nextButton = await screen.findByText("Reset");
    await user.click(nextButton);

    expect(manager.next).toBeCalledTimes(4);
    expect(onError).toBeCalledTimes(2);
    expect(onComplete).toBeCalled();
  });

  test("handles flow error", async () => {
    const manager: FlowManager = {
      next: vitest
        .fn()
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-1",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-2",
              type: "action",
              exp: "err(",
              label: "Error",
            }),
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            value: makeFlow({
              id: "flow-2",
              type: "action",
              exp: "err(",
              label: "Error",
            }),
          }),
        )
        .mockReturnValue(Promise.resolve({ done: true })),
    };
    const onComplete = vitest.fn();
    const onError = vitest.fn();

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

    const screen = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          fallbackComponent={MyFallback}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>,
      { legacyRoot },
    );

    expect(manager.next).toBeCalledWith(undefined);
    const view = await screen.findByTestId("flow-1");
    expect(view).toBeInTheDocument();

    await act(async () => {
      const nextButton = await screen.findByText("Continue");
      nextButton.click();
    });

    await waitFor(() => expect(manager.next).toBeCalledTimes(2));

    const view2 = await screen.findByTestId("flow-2");
    expect(view2).toBeInTheDocument();

    await act(async () => {
      view2.click();
    });

    const retryButton = await screen.findByText("Retry");
    expect(retryButton).toBeInTheDocument();

    await act(async () => {
      retryButton.click();
    });

    expect(manager.next).toBeCalledTimes(3);

    const view3 = await screen.findByTestId("flow-2");
    expect(view3).toBeInTheDocument();

    await act(async () => {
      view3.click();
    });

    const resetButton = await screen.findByText("Retry");
    expect(resetButton).toBeInTheDocument();

    await act(async () => {
      resetButton.click();
    });

    expect(manager.next).toBeCalledTimes(4);
    expect(onError).toBeCalledTimes(2);

    expect(onComplete).toBeCalled();
  });

  test("handles terminating with data", async () => {
    const manager: FlowManager = {
      next: vitest.fn().mockReturnValueOnce(
        Promise.resolve({
          value: {
            ...makeFlow({
              id: "flow-1",
              type: "collection",
              values: [
                {
                  asset: {
                    id: "action",
                    type: "action",
                    value: "Next",
                    label: "Continue",
                  },
                },
              ],
            }),
            data: {
              returns: { id: "123" },
            },
          },
        }),
      ),
      terminate: vitest.fn(),
    };

    const onComplete = vitest.fn();
    const onError = vitest.fn();

    const result = render(
      <Suspense fallback="loading">
        <ManagedPlayer
          manager={manager}
          plugins={[new SimpleAssetPlugin()]}
          onComplete={onComplete}
          onError={onError}
        />
      </Suspense>,
      { legacyRoot },
    );

    await screen.findByTestId("flow-1");
    result.unmount();
    expect(manager.terminate).toBeCalledWith({ returns: { id: "123" } });
  });

  test("handles new manager", async () => {
    const user = userEvent.setup();

    const makeManager = (num: number): FlowManager => {
      return {
        terminate: vitest.fn(),
        next: vitest
          .fn()
          .mockReturnValueOnce(
            Promise.resolve({
              value: makeFlow({
                id: `flow-1-${num}`,
                type: "collection",
                values: [
                  {
                    asset: {
                      id: "action",
                      type: "action",
                      value: "Next",
                      label: "Continue",
                    },
                  },
                ],
              }),
            }),
          )
          .mockReturnValueOnce(
            Promise.resolve({
              value: {
                ...makeFlow({
                  id: `flow-2-${num}`,
                  type: "collection",
                  values: [
                    {
                      asset: {
                        id: "action",
                        type: "action",
                        value: "Next",
                        label: "Continue",
                      },
                    },
                  ],
                }),
                data: { foo: "bar" },
              },
            }),
          )
          .mockReturnValue(Promise.resolve({ done: true })),
      };
    };

    let manager = makeManager(1);
    const previousManager = {
      current: manager,
    };

    const onComplete = vitest.fn();
    const onError = vitest.fn();

    const Wrapper = () => {
      const [count, setCount] = React.useState(1);

      return (
        <div>
          <button
            id="newManager"
            type="button"
            onClick={() =>
              setCount((c) => {
                const newVal = c + 1;
                previousManager.current = manager;
                manager = makeManager(newVal);
                return newVal;
              })
            }
          >
            New Manager {count}
          </button>
          <ManagedPlayer
            manager={manager}
            plugins={[new SimpleAssetPlugin()]}
            onComplete={onComplete}
            onError={onError}
          />
        </div>
      );
    };

    const screen = render(
      <Suspense fallback="loading">
        <Wrapper />
      </Suspense>,
      { legacyRoot },
    );

    expect(manager.next).toBeCalledWith(undefined);
    const view = await screen.findByTestId("flow-1-1");
    expect(view).toBeInTheDocument();

    let newManagerBtn = await screen.findByTestId("newManager");
    await user.click(newManagerBtn);

    expect(previousManager.current.terminate).toBeCalledWith({});
    expect(previousManager.current.next).toBeCalledTimes(1);
    expect(manager.next).toBeCalledTimes(1);
    await screen.findByTestId("flow-1-2");

    newManagerBtn = await screen.findByTestId("newManager");
    await user.click(newManagerBtn);

    const prevMan = previousManager.current;
    expect(prevMan.terminate).toBeCalledWith({});
    expect(prevMan.next).toBeCalledTimes(1);
    expect(manager.next).toBeCalledTimes(1);
    await screen.findByTestId("flow-1-3");

    let nextButton = await screen.findByText("Continue");
    await user.click(nextButton);

    expect(prevMan).toEqual(previousManager.current);
    expect(previousManager.current.next).toBeCalledTimes(1);
    expect(manager.next).toBeCalledTimes(2);

    const view2 = await screen.findByTestId("flow-2-3");
    expect(view2).toBeInTheDocument();

    nextButton = await screen.findByText("Continue");
    await user.click(nextButton);

    expect(prevMan).toEqual(previousManager.current);
    expect(previousManager.current.next).toBeCalledTimes(1);
    expect(manager.next).toBeCalledTimes(3);

    expect(onComplete).toBeCalledWith(
      expect.objectContaining({
        status: "completed",
        data: { foo: "bar" },
      }),
    );
  });
});
