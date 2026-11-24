/// <reference lib="es2021.weakref" />
import { test, expect, vitest } from "vitest";
import v8 from "node:v8";
import vm from "node:vm";
import { makeFlow } from "@player-ui/make-flow";
import { Player } from "../../..";
import type { InProgressState } from "../../../types";
import { AssetTransformPlugin } from "../../../__tests__/helpers/transform-plugin";

v8.setFlagsFromString("--expose-gc");
const gc: () => void = vm.runInNewContext("gc");

test("releases earlier updates' nodes when a transform keeps its resolve options", async () => {
  const player = new Player({
    plugins: [
      // Like the reference action, whose `run` keeps `options.evaluate`
      new AssetTransformPlugin([
        [
          { type: "action" },
          {
            resolve: (asset: any, options: any) => ({
              ...asset,
              run: () => options.evaluate(asset.exp),
            }),
          },
        ],
      ]),
    ],
  });
  /** The nodes each update re-resolved, held weakly */
  const resolvedByUpdate: Array<Array<WeakRef<object>>> = [];

  player.hooks.view.tap("test", (view) => {
    view.hooks.resolver.tap("test", (resolver) => {
      resolver.hooks.beforeUpdate.tap("test", () => {
        resolvedByUpdate.push([]);
      });
      resolver.hooks.afterNodeUpdate.tap("test", (_node, _parent, update) => {
        if (update.updated) {
          resolvedByUpdate[resolvedByUpdate.length - 1]?.push(
            new WeakRef(update.node),
          );
        }
      });
    });
  });

  player.start(
    makeFlow({
      id: "actions",
      type: "collection",
      values: [
        { asset: { id: "action-a", type: "action", value: "{{a}}" } },
        { asset: { id: "action-b", type: "action", value: "{{b}}" } },
      ],
    }),
  );
  const { controllers } = player.getState() as InProgressState;

  // The actions take turns re-resolving, so each update reuses the other
  // action's value, and its `run`, from the update before.
  for (let count = 1; count <= 20; count += 1) {
    const [binding, index] = count % 2 ? ["a", 0] : ["b", 1];
    controllers.data.set([[binding, count]]);
    await vitest.waitFor(() =>
      expect(
        String(
          controllers.view.currentView?.lastUpdate?.values[index].asset.value,
        ),
      ).toBe(`${count}`),
    );
  }

  // WeakRef targets stay alive until the current job ends.
  await new Promise((resolve) => setTimeout(resolve, 0));
  gc();

  // The last update's nodes are the view on screen, and so is the action the
  // update before it re-resolved.
  const replaced = resolvedByUpdate.slice(0, -2).flat();
  expect(replaced.length).toBeGreaterThan(0);
  expect(replaced.filter((ref) => ref.deref() !== undefined)).toHaveLength(0);
});
