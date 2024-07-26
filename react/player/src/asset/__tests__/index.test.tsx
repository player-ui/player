import { test, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Registry } from "@player-ui/partial-match-registry";
import type { Asset as AssetType } from "@player-ui/player";
import type { AssetRegistryType } from "..";
import { ReactAsset, AssetContext } from "..";

test("it prioritizes local type and id", () => {
  const assetDef = {
    id: "foo",
    type: "foo",
    asset: {
      id: "bar",
      type: "bar",
    },
  };

  const registry: AssetRegistryType = new Registry([
    [{ type: "foo" }, () => <div>foo</div>],
    [{ type: "bar" }, () => <div>bar</div>],
  ]);

  const asset = render(
    <AssetContext.Provider value={{ registry }}>
      <ReactAsset {...assetDef} />
    </AssetContext.Provider>,
  );

  expect(asset.getByText("foo")).not.toBeUndefined();
});

test("throws an error for an asset missing implementation or not registered", () => {
  const assetDef = {
    asset: {
      id: "bar-id",
      type: "test",
    },
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: "bar", key: "bar-key" }, () => <div>bar</div>],
    [{ type: "foo", key: "foo-key" }, () => <div>foo</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  )
    .toThrowError(`No implementation found for id: bar-id type: test. Did you mean bar? \n 
      Registered Asset matching functions are listed below: \n
      [{"type":"foo","key":"foo-key"},{"type":"bar","key":"bar-key"}]`);
});

test("throws an error for an asset missing type", () => {
  const assetDef = {
    asset: {
      id: "bar-id",
    },
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: "foo" }, () => <div>foo</div>],
    [{ type: "bar" }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  ).toThrowError("Asset is missing type for id: bar-id");
});

test("throws an error for an asset that isnt an object", () => {
  const assetDef = {
    asset: "bar",
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: "foo" }, () => <div>foo</div>],
    [{ type: "bar" }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  ).toThrowError("Asset was not an object got (string) instead: bar");
});

test("throws an error for an asset that is an object but not valid", () => {
  const assetDef = {
    asset: ["a"],
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: "foo" }, () => <div>foo</div>],
    [{ type: "bar" }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  ).toThrowError('Asset is missing type for {"asset":["a"]}');
});
test("throws an error for an asset that unwraps nothing", () => {
  const assetDef = {
    asset: undefined,
  } as unknown as AssetType;

  const registry: AssetRegistryType = new Registry([
    [{ type: "foo" }, () => <div>foo</div>],
    [{ type: "bar" }, () => <div>bar</div>],
  ]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  ).toThrowError("Cannot determine asset type for props: {}");
});

test("throw an error for no assets in registry", () => {
  const assetDef = {
    id: "foo",
    type: "foo",
    asset: {
      id: "bar",
      type: "bar",
    },
  };

  const registry: AssetRegistryType = new Registry([]);

  expect(() =>
    render(
      <AssetContext.Provider value={{ registry }}>
        <ReactAsset {...assetDef} />
      </AssetContext.Provider>,
    ),
  )
    .toThrowError(`No asset found in registry. This could happen for one of the following reasons: \n
      1. You might have no assets registered or no plugins added to the Player instance. \n
      2. You might have mismatching versions of React Asset Registry Context. \n
      See https://player-ui.github.io/latest/tools/cli#player-dependency-versions-check for tips about how to debug and fix this problem`);
});
