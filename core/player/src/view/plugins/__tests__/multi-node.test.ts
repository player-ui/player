import { describe, it, expect, beforeEach } from "vitest";
import { Parser } from "../../parser";
import { MultiNodePlugin, AssetPlugin } from "..";

describe("multi-node", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
    new AssetPlugin().applyParser(parser);
    new MultiNodePlugin().applyParser(parser);
  });

  it("multi-node collection", () => {
    expect(
      parser.parseObject({
        id: "foo",
        type: "collection",
        values: [
          {
            asset: {
              id: "value-1",
              type: "text",
              value: "First value in the collection",
            },
          },
          {
            asset: {
              id: "value-2",
              type: "text",
              value: "Second value in the collection",
            },
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});
