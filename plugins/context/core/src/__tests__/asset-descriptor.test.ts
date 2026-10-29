import { describe, test, expect } from "vitest";
import type { Asset } from "@player-ui/player";
import {
  constant,
  defineAssetContext,
  each,
  findNestedAssets,
  findNestedAssetsBySlot,
  getPath,
  prop,
  toAssetContext,
  toCollateOptions,
} from "../asset-descriptor";

const input = {
  id: "name-input",
  type: "input",
  binding: "data.name",
  value: "Ada",
  label: { asset: { id: "name-label", type: "text", value: "Name" } },
  metaData: { role: "primary" },
  set: () => undefined,
};

const collection = {
  id: "profile",
  type: "collection",
  label: { asset: { id: "profile-label", type: "text", value: "Profile" } },
  values: [
    { asset: input },
    {
      asset: {
        id: "wrapper",
        type: "wrapper",
        content: {
          asset: { id: "email-input", type: "input", binding: "data.email" },
        },
      },
    },
  ],
};

describe("getPath / prop / constant", () => {
  test("reads dot-separated and segmented paths", () => {
    expect(getPath(input, "metaData.role")).toBe("primary");
    expect(getPath(input, ["label", "asset", "value"])).toBe("Name");
    expect(getPath(input, "missing.deep")).toBeUndefined();
  });

  test("prop and constant build extractors", () => {
    expect(prop("label.asset.value")(input)).toBe("Name");
    expect(constant("fixed")(input)).toBe("fixed");
  });
});

describe("each", () => {
  test("maps array items through their own fields", () => {
    const choices = {
      id: "c",
      type: "choice",
      items: [
        { id: "a", label: "A", select: () => undefined },
        { id: "b", label: "B" },
      ],
    };
    expect(
      each("items", { id: "id", label: prop("label"), select: "select" })(
        choices,
      ),
    ).toEqual([
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ]);
  });

  test("returns undefined when the path isn't an array", () => {
    expect(each("value", { id: "id" })(input)).toBeUndefined();
  });
});

describe("toAssetContext", () => {
  test("always includes id and type and picks fields", () => {
    const descriptor = defineAssetContext<typeof input>({
      fields: {
        binding: "binding",
        value: "value",
        label: (asset) => asset.label.asset.value,
        role: "metaData.role",
      },
    });

    expect(toAssetContext(descriptor, input)).toEqual({
      id: "name-input",
      type: "input",
      binding: "data.name",
      value: "Ada",
      label: "Name",
      role: "primary",
    });
  });

  test("skips undefined and function values", () => {
    const descriptor = defineAssetContext<typeof input>({
      fields: { missing: "nope", set: "set", run: () => () => undefined },
    });

    expect(toAssetContext(descriptor, input)).toEqual({
      id: "name-input",
      type: "input",
    });
  });

  test("records child ids per slot", () => {
    const descriptor = defineAssetContext({
      children: ["values", "label"],
    });

    expect(toAssetContext(descriptor, collection).children).toEqual({
      values: ["name-input", "wrapper"],
      label: ["profile-label"],
    });
  });

  test("walks through assets that don't count as children", () => {
    const descriptor = defineAssetContext({ children: ["values"] });

    expect(
      toAssetContext(descriptor, collection, {
        isDescribed: (asset) => asset.type !== "wrapper",
      }).children,
    ).toEqual({ values: ["name-input", "email-input"] });
  });

  test("merges extract last but never overrides id or type", () => {
    const descriptor = defineAssetContext({
      fields: { value: "value" },
      extract: () => ({ value: "override", id: "other", extra: 1 }),
    });

    expect(toAssetContext(descriptor, input)).toEqual({
      id: "name-input",
      type: "input",
      value: "override",
      extra: 1,
    });
  });
});

describe("findNestedAssets", () => {
  test("finds the nearest asset wrappers in document order", () => {
    expect(findNestedAssets(collection.values).map((a) => a.id)).toEqual([
      "name-input",
      "wrapper",
    ]);
  });

  test("groups nested assets by top-level slot", () => {
    const bySlot = findNestedAssetsBySlot(collection as unknown as Asset);
    expect(Object.keys(bySlot)).toEqual(["label", "values"]);
    expect(bySlot.values?.map((a) => a.id)).toEqual(["name-input", "wrapper"]);
  });
});

describe("toCollateOptions", () => {
  test("applies defaults", () => {
    expect(toCollateOptions("values")).toEqual({
      slot: "values",
      as: "values",
      depth: "all",
      hide: true,
      reduce: undefined,
    });
  });

  test("keeps explicit options", () => {
    const reduce = () => "summary";
    expect(
      toCollateOptions({
        slot: ["a", "b"],
        depth: 1,
        hide: false,
        reduce,
      }),
    ).toEqual({ slot: ["a", "b"], as: "a.b", depth: 1, hide: false, reduce });
  });
});
