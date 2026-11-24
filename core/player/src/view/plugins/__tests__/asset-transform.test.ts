/// <reference lib="es2021.weakref" />
import { test, expect, vitest } from "vitest";
import v8 from "node:v8";
import vm from "node:vm";
import { makeFlow } from "@player-ui/make-flow";
import { Player } from "../../..";
import type { InProgressState } from "../../../types";
import { NodeType } from "../../parser";
import { AssetTransformPlugin } from "../../../__tests__/helpers/transform-plugin";

v8.setFlagsFromString("--expose-gc");
const gc: () => void = vm.runInNewContext("gc");

test("releases the nodes a dynamic template made in earlier updates", async () => {
  const player = new Player({
    plugins: [
      new AssetTransformPlugin([
        [{ type: "text" }, { resolve: (asset: any) => asset }],
      ]),
    ],
  });
  /** The asset nodes the template made in each update, held weakly */
  const madeByUpdate: Array<Array<WeakRef<object>>> = [];

  player.hooks.view.tap("test", (view) => {
    view.hooks.resolver.tap("test", (resolver) => {
      resolver.hooks.beforeUpdate.tap("test", () => {
        madeByUpdate.push([]);
      });
      resolver.hooks.afterNodeUpdate.tap("test", (node) => {
        if (node.type === NodeType.Asset) {
          madeByUpdate[madeByUpdate.length - 1]?.push(new WeakRef(node));
        }
      });
    });
  });

  player.start(
    makeFlow({
      id: "pets",
      type: "collection",
      template: [
        {
          dynamic: true,
          data: "pets",
          output: "values",
          value: {
            asset: {
              id: "pet-_index_",
              type: "text",
              value: "{{pets._index_}}",
            },
          },
        },
      ],
    }),
  );
  const { controllers } = player.getState() as InProgressState;

  for (let count = 1; count <= 20; count += 1) {
    controllers.data.set([["pets", [`Pet ${count}`]]]);
    await vitest.waitFor(() =>
      expect(
        controllers.view.currentView?.lastUpdate?.values?.[0].asset.value,
      ).toBe(`Pet ${count}`),
    );
  }

  // WeakRef targets stay alive until the current job ends.
  await new Promise((resolve) => setTimeout(resolve, 0));
  gc();

  // The template makes new nodes on every update, so only the last update's
  // are on screen.
  const replaced = madeByUpdate.slice(0, -1).flat();
  expect(replaced.length).toBeGreaterThan(0);
  expect(replaced.filter((ref) => ref.deref() !== undefined)).toHaveLength(0);
});
