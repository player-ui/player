import { test, expect } from "vitest";
import { identify, ObjType } from "../identify";

test("finds an asset", () => {
  expect(
    identify({
      id: "some-id",
      type: "text",
      value: "I am a text asset",
    }),
  ).toBe(ObjType.ASSET);
});

test("finds an asset wrapper", () => {
  expect(
    identify({
      asset: {
        id: "some-id",
        type: "text",
        value: "I am a text asset",
      },
    }),
  ).toBe(ObjType.ASSET_WRAPPER);
});

test("finds a flow", () => {
  expect(identify({ id: "foo", navigation: {} })).toBe(ObjType.FLOW);
});

test("panics", () => {
  expect(identify([])).toBe(ObjType.UNKNOWN);
});
