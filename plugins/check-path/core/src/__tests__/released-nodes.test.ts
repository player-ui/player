/// <reference lib="es2021.weakref" />
import { test, expect, vitest } from "vitest";
import v8 from "node:v8";
import vm from "node:vm";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";
import { CheckPathPlugin } from "..";

v8.setFlagsFromString("--expose-gc");
const gc: () => void = vm.runInNewContext("gc");

/** Holds, weakly, the nodes each update of the player's views re-resolves */
function trackResolvedNodes(player: Player): Array<Array<WeakRef<object>>> {
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

  return resolvedByUpdate;
}

/** Collects garbage in a job of its own */
async function collectGarbage() {
  // WeakRef targets stay alive until the current job ends.
  await new Promise((resolve) => setTimeout(resolve, 0));
  gc();
}

test("releases the nodes a dynamic template made in earlier updates", async () => {
  const player = new Player({ plugins: [new CheckPathPlugin()] });
  const resolvedByUpdate = trackResolvedNodes(player);

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

  await collectGarbage();

  // The template makes new nodes on every update, so only the last update's
  // are on screen.
  const replaced = resolvedByUpdate.slice(0, -1).flat();
  expect(replaced.length).toBeGreaterThan(0);
  expect(replaced.filter((ref) => ref.deref() !== undefined)).toHaveLength(0);
});

test("forgets the assets that left the view", async () => {
  const checkPath = new CheckPathPlugin();
  const player = new Player({ plugins: [checkPath] });
  const resolvedByUpdate = trackResolvedNodes(player);

  player.start(
    makeFlow({
      id: "pets",
      type: "collection",
      values: [
        { asset: { id: "pet-{{count}}", type: "text", value: "{{count}}" } },
      ],
    }),
  );
  const { controllers } = player.getState() as InProgressState;

  for (let count = 1; count <= 20; count += 1) {
    controllers.data.set([["count", count]]);
    await vitest.waitFor(() =>
      expect(
        controllers.view.currentView?.lastUpdate?.values?.[0].asset.id,
      ).toBe(`pet-${count}`),
    );
  }

  expect(checkPath.getParentProp("pet-20")).toBe("values");
  expect(checkPath.getParentProp("pet-19")).toBeUndefined();

  await collectGarbage();

  // The asset's id changes on every update, so only the last update's nodes
  // are on screen.
  const replaced = resolvedByUpdate.slice(0, -1).flat();
  expect(replaced.length).toBeGreaterThan(0);
  expect(replaced.filter((ref) => ref.deref() !== undefined)).toHaveLength(0);
});
