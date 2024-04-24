import { test, expect } from "vitest";
import type {
  TransformFunction,
  TransformFunctions,
  BeforeTransformFunction,
  Node,
} from "@player-ui/player";
import type { Asset } from "@player-ui/types";
import { compose, composeBefore } from "../utils";

interface TextAsset extends Asset<"text"> {
  /**
   *
   */
  value: string;
  /**
   *
   */
  metaData?: {
    /**
     *
     */
    sensitive?: boolean;
    /**
     *
     */
    size?: any;
  };
}

const textAsset: TextAsset = {
  id: "textAsset",
  type: "text",
  value: "Text",
};

const textNode: Node.Asset<TextAsset> = {
  type: "asset" as any,
  value: textAsset,
};

/**
 *
 */
const transform1: TransformFunction<TextAsset> = (asset) => asset;
/**
 *
 */
const transform2: TransformFunction<TextAsset> = (asset) => ({
  ...asset,
  metaData: { sensitive: true },
});
const transform3: TransformFunctions = {
  resolve: (asset) => ({
    ...asset,
    metaData: { ...asset.metaData, size: "large" },
  }),
};
const transform4: TransformFunctions = {
  resolve: (asset) => asset,
  beforeResolve: (node) => node,
};
/**
 *
 */
const beforeTransform: BeforeTransformFunction<TextAsset> = (node) => node;
/**
 *
 */
const beforeTransformWithChildren: BeforeTransformFunction<TextAsset> = (
  node,
) => ({
  ...node,
  children: [],
});

test("creates a transform function object with beforeResolve and resolve functions", () => {
  const composedTransform = compose(transform1, composeBefore(beforeTransform));

  expect(composedTransform).toStrictEqual(
    expect.objectContaining({
      beforeResolve: expect.any(Function),
      resolve: expect.any(Function),
    }),
  );

  const composedWithTransformFunctionsArg = compose(transform1, transform4);

  expect(composedWithTransformFunctionsArg).toStrictEqual(
    expect.objectContaining({
      beforeResolve: expect.any(Function),
      resolve: expect.any(Function),
    }),
  );
});

test("correctly compose the functions together", () => {
  const composedTransform = compose(transform3, transform2, transform1);

  expect(composedTransform.resolve?.(textAsset, {} as any, {} as any))
    .toMatchInlineSnapshot(`
      {
        "id": "textAsset",
        "metaData": {
          "sensitive": true,
          "size": "large",
        },
        "type": "text",
        "value": "Text",
      }
    `);

  // Since no deep merges, it overrides `metaData`
  const composedWithOverrideTransform = compose(
    transform2,
    transform3,
    transform1,
  );
  expect(
    composedWithOverrideTransform.resolve?.(textAsset, {} as any, {} as any),
  ).toMatchInlineSnapshot(`
    {
      "id": "textAsset",
      "metaData": {
        "sensitive": true,
      },
      "type": "text",
      "value": "Text",
    }
  `);
});

test("composeBefore correctly composes any functions together", () => {
  const before = composeBefore(beforeTransformWithChildren, beforeTransform);

  expect(before).toStrictEqual(
    expect.objectContaining({
      beforeResolve: expect.any(Function),
    }),
  );

  expect(before.beforeResolve?.(textNode, {} as any, {} as any))
    .toMatchInlineSnapshot(`
      {
        "children": [],
        "type": "asset",
        "value": {
          "id": "textAsset",
          "type": "text",
          "value": "Text",
        },
      }
    `);
});

test("returns correctly with only one function", () => {
  const composedTransform = compose(transform2);

  expect(composedTransform.resolve?.(textAsset, {} as any, {} as any))
    .toMatchInlineSnapshot(`
      {
        "id": "textAsset",
        "metaData": {
          "sensitive": true,
        },
        "type": "text",
        "value": "Text",
      }
    `);
});
