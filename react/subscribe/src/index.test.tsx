import { test, vitest, expect, describe, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { Subscribe, useSubscribedState, useSubscriber } from ".";

test("Passes events to subscriptions", async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, publish } = stateSub;
  const f = vitest.fn();
  add(f);
  publish({ value: true });

  await vitest.waitFor(() => expect(f).toBeCalledTimes(1));
  expect(f.mock.calls[0][0].value).toBe(true);
});

test("Removes subscriptions", async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, remove, publish } = stateSub;
  const f = vitest.fn();
  const id = add(f);
  remove(id);
  publish({ value: true });

  await vitest.waitFor(() => expect(f).not.toHaveBeenCalled());
});

test("Calls multiple", async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, publish } = stateSub;
  const f = vitest.fn();
  const g = vitest.fn();
  add(f);
  add(g);
  publish({ value: true });

  await vitest.waitFor(() => expect(f).toBeCalledTimes(1));
  expect(g).toBeCalledTimes(1);
});

describe("useSubscribedState", () => {
  test("updates value based on Subscriber changes", async () => {
    const stateSub = new Subscribe<boolean>();
    const addSpy = vi.spyOn(stateSub, "add");
    const removeSpy = vi.spyOn(stateSub, "remove");

    const { result, rerender, unmount } = renderHook(() =>
      useSubscribedState(stateSub),
    );
    expect(result.current).toBeUndefined();
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    await stateSub.publish(true);
    expect(result.current).toBe(true);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    await stateSub.publish(false);
    expect(result.current).toBe(false);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    rerender();
    expect(result.current).toBe(false);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    await stateSub.reset();
    expect(result.current).toBeUndefined();
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(0);

    unmount();
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });
});

describe("useSubscriber", () => {
  test("should expose subscribe and unsubscribe functions and unsubscribe all on unmount", async () => {
    const stateSub = new Subscribe<{
      value: boolean;
    }>();
    await stateSub.publish({ value: true });

    const { result, unmount } = renderHook(() => useSubscriber(stateSub));

    const firstSubFunction = vi.fn();
    const secondSubFunction = vi.fn();

    // 1. Subscribe and check options are passed as expected.
    const firstSubId = result.current.subscribe(firstSubFunction, {
      initializeWithPreviousValue: true,
    });
    result.current.subscribe(secondSubFunction, {
      initializeWithPreviousValue: false,
    });

    expect(firstSubFunction).toHaveBeenCalledOnce();
    expect(firstSubFunction).toHaveBeenCalledWith({ value: true });
    expect(secondSubFunction).not.toHaveBeenCalled();

    // Clear for future tests
    firstSubFunction.mockClear();

    // 2. Check both subscriptions work
    await stateSub.publish({ value: false });
    expect(firstSubFunction).toHaveBeenCalledOnce();
    expect(firstSubFunction).toHaveBeenCalledWith({ value: false });
    expect(secondSubFunction).toHaveBeenCalledOnce();
    expect(secondSubFunction).toHaveBeenCalledWith({ value: false });

    // Clear for future tests
    firstSubFunction.mockClear();
    secondSubFunction.mockClear();

    // 3. Check unsubscribe works
    result.current.unsubscribe(firstSubId);
    await stateSub.publish({ value: true });
    expect(firstSubFunction).not.toHaveBeenCalled();
    expect(secondSubFunction).toHaveBeenCalledOnce();
    expect(secondSubFunction).toHaveBeenCalledWith({ value: true });

    // Clear for future tests
    secondSubFunction.mockClear();

    // 4. Check unsub on unmount
    unmount();
    stateSub.publish({ value: false });
    expect(firstSubFunction).not.toHaveBeenCalled();
    expect(secondSubFunction).not.toHaveBeenCalled();
  });
});
