import React from "react";
import { vi, bench, describe, expect } from "vitest";
import { AssetContext, AssetRegistryType, ReactAsset } from "..";
import type { Asset, AssetWrapper } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { render, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "react-error-boundary";

type FooProps = Asset<"foo"> & {
  nested: AssetWrapper;
};

type BarProps = Asset<"bar">;

type BrokeProps = Asset<"broke">;

const registry: AssetRegistryType = new Registry<React.ComponentType<any>>([
  [
    { type: "foo" },
    ({ nested }: FooProps) => <ReactAsset asset={nested.asset} />,
  ],
  [{ type: "bar" }, ({ id }: BarProps) => <div data-testid={id} />],
  [
    { type: "broke" },
    ({ id }: BrokeProps) => {
      throw new Error(`Thrown by ${id}`);
    },
  ],
]);

const createWithDepth = (depth: number, finalAssetType = "bar"): Asset => {
  const root: Asset = {
    type: finalAssetType,
    id: "1",
  };
  let current: Asset = root;

  for (let i = depth; i > 1; i--) {
    current.type = "foo";
    current.id = String(i);
    const next: Asset = {
      type: finalAssetType,
      id: "1",
    };

    current.nested = { asset: next };
    current = next;
  }

  return root;
};

// Bench tests for rendering ReactAssets. Used to measure overhead this component is adding to the underlying assets that need to render.
describe("ReactAsset benchmarks", () => {
  const depths = [1, 5, 10, 50, 100];

  depths.forEach((depth) => {
    const asset = createWithDepth(depth);

    bench(
      `Render asset nested in ${depth} ReactAssets`,
      async () => {
        const { findByTestId } = render(
          <AssetContext.Provider value={{ registry }}>
            <ReactAsset asset={asset} />
          </AssetContext.Provider>,
        );

        await findByTestId("1"); // Wait for render to complete and find the "bar" asset
        cleanup(); // Bench tests do not automatically cleanup after each iteration
      },
      { iterations: 100, throws: true },
    );

    const brokenAsset = createWithDepth(depth, "broke");

    bench(
      `Bubble errors nested in ${depth} ReactAssets`,
      async () => {
        let err: Error | undefined;
        render(
          <ErrorBoundary
            onError={(e) => {
              err = e;
            }}
            fallbackRender={() => null}
          >
            <AssetContext.Provider value={{ registry }}>
              <ReactAsset asset={brokenAsset} />
            </AssetContext.Provider>
          </ErrorBoundary>,
        );

        await vi.waitFor(() => {
          expect(err).toBeDefined();
        }); // Wait for error to be thrown
        cleanup(); // Bench tests do not automatically cleanup after each iteration
      },
      { iterations: 100, throws: true },
    );
  });
});
