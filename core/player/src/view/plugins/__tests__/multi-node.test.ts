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

  it("should parse an array into a multi node", () => {
    expect(
      parser.parseObject([
        {
          asset: {
            type: "type",
            id: "asset-1",
          },
        },
      ]),
    ).toStrictEqual({
      override: false,
      type: "multi-node",
      values: [
        {
          type: "value",
          value: undefined,
          parent: expect.anything(),
          children: [
            {
              path: ["asset"],
              value: {
                type: "asset",
                parent: expect.anything(),
                value: {
                  id: "asset-1",
                  type: "type",
                },
              },
            },
          ],
        },
      ],
    });
  });
});
