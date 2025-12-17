import React from "react";
import { bench, describe } from "vitest";
import { AssetContext, AssetRegistryType, ReactAsset } from "..";
import type { Asset, AssetWrapper } from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";
import { render, cleanup } from "@testing-library/react";

type FooProps = Asset<"foo"> & {
  nested: AssetWrapper;
};

type BarProps = Asset<"bar">;

const registry: AssetRegistryType = new Registry<React.ComponentType<any>>([
  [
    { type: "foo" },
    ({ nested }: FooProps) => <ReactAsset asset={nested.asset} />,
  ],
  [{ type: "bar" }, ({ id }: BarProps) => <div data-testid={id}>WOT</div>],
]);

const createWithDepth = (depth: number): Asset => {
  const root: Asset = {
    type: "bar",
    id: "1",
  };
  let current: Asset = root;

  for (let i = depth; i > 1; i--) {
    current.type = "foo";
    current.id = String(i);
    const next: Asset = {
      type: "bar",
      id: "1",
    };

    current.nested = { asset: next };
    current = next;
  }

  return root;
};

// Benchmark tests for async node resolution. Each test spins up player and resolves all but the last async node to be setup.
// This is to make tests results easier to compare. If test results across different node counts are similar than we know that resolving additional async nodes will not have significant performance impact.
describe("async node benchmarks", () => {
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
  });
});
