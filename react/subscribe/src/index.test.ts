import { waitFor } from '@testing-library/react';
import { Subscribe } from '.';

test('Passes events to subscriptions', async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, publish } = stateSub;
  const f = jest.fn();
  add(f);
  publish({ value: true });

  await waitFor(() => expect(f).toBeCalledTimes(1));
  expect(f.mock.calls[0][0].value).toBe(true);
});

test('Removes subscriptions', async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, remove, publish } = stateSub;
  const f = jest.fn();
  const id = add(f);
  remove(id);
  publish({ value: true });

  await waitFor(() => expect(f).not.toHaveBeenCalled());
});

test('Calls multiple', async () => {
  const stateSub = new Subscribe<{
    value: boolean;
  }>();
  const { add, publish } = stateSub;
  const f = jest.fn();
  const g = jest.fn();
  add(f);
  add(g);
  publish({ value: true });

  await waitFor(() => expect(f).toBeCalledTimes(1));
  expect(g).toBeCalledTimes(1);
});
