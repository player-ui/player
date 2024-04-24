import { test, vitest, expect } from "vitest";
import { Subscribe } from ".";

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
