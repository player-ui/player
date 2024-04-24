import { test, expect } from "vitest";
import { buildUrl } from "../url";

test("builds a URL with no query parameters added", () => {
  expect(buildUrl("https://example.com")).toMatchInlineSnapshot(
    `"https://example.com/"`,
  );
});

test("builds a URL with object of query parameters added", () => {
  expect(
    buildUrl("https://example.com", { a: 1, b: 2, c: "3", d: true }),
  ).toMatchInlineSnapshot(`"https://example.com/?a=1&b=2&c=3&d=true"`);
});
