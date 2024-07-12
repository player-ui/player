import { test, expect, describe } from "vitest";
import type { Node } from "@player-ui/player";
import { Parser } from "@player-ui/player";
import { composeBefore, propertiesToSkipTransform } from "..";

const parser = new Parser();

const actionAsset = {
  id: "action",
  type: "action",
  exp: "{{count}} = {{count}} + 1",
  label: {
    asset: {
      id: "action-label",
      type: "text",
      value: "Count: {{count}}",
    },
  },
};

const actionAssetNode: Node.Asset = parser.parseObject(
  actionAsset,
) as Node.Asset;

const actionAsset2 = {
  id: "action",
  type: "action",
  exp: "{{count}} = {{count}} + 1",
  label: {
    asset: {
      id: "action-label",
      type: "text",
      value: "Count: {{count}}",
    },
  },
  plugins: {
    stringResolver: {
      propertiesToSkip: ["exp"],
    },
  },
};

const actionAsset2Node: Node.Asset = parser.parseObject(
  actionAsset2,
) as Node.Asset;

describe("propertiesToSkip", () => {
  test("adds exp to the plugin stringResolver.propertiesToSkip", () => {
    const before = composeBefore(propertiesToSkipTransform(["exp"]));

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAssetNode, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
          ],
          "plugins": {
            "stringResolver": {
              "propertiesToSkip": [
                "exp",
              ],
            },
          },
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });

  test("Does not duplicate if propertiesToSkip already contains the value", () => {
    const before = composeBefore(propertiesToSkipTransform(["exp"]));

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAsset2Node, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
            {
              "path": [
                "plugins",
                "stringResolver",
                "propertiesToSkip",
              ],
              "value": {
                "override": true,
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "multi-node",
                "values": [
                  {
                    "parent": [Circular],
                    "type": "value",
                    "value": "exp",
                  },
                ],
              },
            },
          ],
          "plugins": {
            "stringResolver": {
              "propertiesToSkip": [
                "exp",
              ],
            },
          },
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });

  test("Does not add an empty array", () => {
    const before = composeBefore(propertiesToSkipTransform([""]));

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAssetNode, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": [Circular],
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
          ],
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });

  test("Returns original Asset if the parameter passed in an empty array", () => {
    const before = composeBefore(propertiesToSkipTransform([""]));

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAsset2Node, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": [Circular],
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
            {
              "path": [
                "plugins",
                "stringResolver",
                "propertiesToSkip",
              ],
              "value": {
                "override": true,
                "parent": [Circular],
                "type": "multi-node",
                "values": [
                  {
                    "parent": [Circular],
                    "type": "value",
                    "value": "exp",
                  },
                ],
              },
            },
          ],
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });

  test("Adds multiple values to propertiesToSkip, but skips empty strings", () => {
    const before = composeBefore(
      propertiesToSkipTransform(["exp", "", "", "label"]),
    );

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAsset2Node, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
            {
              "path": [
                "plugins",
                "stringResolver",
                "propertiesToSkip",
              ],
              "value": {
                "override": true,
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "multi-node",
                "values": [
                  {
                    "parent": [Circular],
                    "type": "value",
                    "value": "exp",
                  },
                ],
              },
            },
          ],
          "plugins": {
            "stringResolver": {
              "propertiesToSkip": [
                "exp",
                "label",
              ],
            },
          },
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });

  test("Adds values to propertiesToSkip and retains original values", () => {
    const before = composeBefore(propertiesToSkipTransform(["label", "test"]));

    expect(before).toStrictEqual(
      expect.objectContaining({
        beforeResolve: expect.any(Function),
      }),
    );

    expect(before.beforeResolve?.(actionAsset2Node, {} as any, {} as any))
      .toMatchInlineSnapshot(`
        {
          "children": [
            {
              "path": [
                "label",
                "asset",
              ],
              "value": {
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "asset",
                "value": {
                  "id": "action-label",
                  "type": "text",
                  "value": "Count: {{count}}",
                },
              },
            },
            {
              "path": [
                "plugins",
                "stringResolver",
                "propertiesToSkip",
              ],
              "value": {
                "override": true,
                "parent": {
                  "children": [Circular],
                  "type": "value",
                  "value": {
                    "exp": "{{count}} = {{count}} + 1",
                    "id": "action",
                    "type": "action",
                  },
                },
                "type": "multi-node",
                "values": [
                  {
                    "parent": [Circular],
                    "type": "value",
                    "value": "exp",
                  },
                ],
              },
            },
          ],
          "plugins": {
            "stringResolver": {
              "propertiesToSkip": [
                "label",
                "test",
              ],
            },
          },
          "type": "value",
          "value": {
            "exp": "{{count}} = {{count}} + 1",
            "id": "action",
            "type": "action",
          },
        }
      `);
  });
});
