import { describe, test, expect } from "vitest";
import { Builder } from ".";
import { NodeType } from "../parser";

test("asset", () => {
  const result = Builder.asset({ id: "foo", type: "text" });
  expect(result.type).toBe(NodeType.Asset);
  expect(result.value.type).toBe("text");
});

describe("value", () => {
  test("with no parameters", () => {
    const result = Builder.value();
    expect(result.type).toBe(NodeType.Value);
    expect(result.value).toBeUndefined();
  });

  test("with parameters", () => {
    const result = Builder.value({ foo: true });
    expect(result.type).toBe(NodeType.Value);
    expect(result.value.foo).toBe(true);
  });
});

describe("multiNode", () => {
  test("sets the parent node on all nodes", () => {
    const v1 = Builder.value({ id: 1 });
    const v2 = Builder.value({ id: 2 });
    const result = Builder.multiNode(v1, v2);

    expect(result.type).toBe(NodeType.MultiNode);
    expect(v1.parent).toBe(result);
    expect(v2.parent).toBe(result);
  });
});

test("async node", () => {
  const result = Builder.asyncNode("1");
  expect(result.type).toBe(NodeType.Async);
  expect(result.id).toBe("1");
});

test("asset wrapper", () => {
  const result = Builder.assetWrapper({ id: "asset", type: "text" });

  expect(result.type).toBe(NodeType.Value);
  expect(result.children?.[0]?.value.type).toBe("asset");
  expect(result.children?.[0]?.value.value.id).toBe("asset");
});

describe("addChild", () => {
  test("sets the parent on the child node", () => {
    const asset = Builder.asset({ id: "asset", type: "text" });
    const value = Builder.value({ id: 2 });
    Builder.addChild(asset, "childValue", value);

    expect(value.parent).toBe(asset);
  });
  test("returns the original node", () => {
    const original = Builder.asset({ id: "asset", type: "text" });
    const value = Builder.value({ id: 2 });
    const updated = Builder.addChild(original, "childValue", value);

    expect(updated).toBe(original);
  });
  test("appends to an existing child array", () => {
    const parent = Builder.asset({ id: "asset", type: "text" });
    const v1 = Builder.value({ id: 1 });
    const v2 = Builder.value({ id: 2 });
    Builder.addChild(parent, "first", v1);
    Builder.addChild(parent, "second", v2);

    expect(parent.children).toHaveLength(2);
  });

  test("handles an array of path segments", () => {
    const asset = Builder.asset({ id: "asset", type: "text" });
    const value = Builder.value({ id: 2 });
    Builder.addChild(asset, ["path1", "path2"], value);

    expect(asset.children?.[0].path).toStrictEqual(["path1", "path2"]);
  });
});
