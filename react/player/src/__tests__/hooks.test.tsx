import { test, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReactPlayer } from "..";

test("reactPlayer hook", () => {
  const { result } = renderHook(() => useReactPlayer());
  expect(result.current.reactPlayer).toBeDefined();
});
