import { act } from "react";
import { test, vitest, expect, describe, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Subscribe, useSubscribedState } from ".";

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
