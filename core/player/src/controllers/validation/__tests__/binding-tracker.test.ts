/// <reference lib="es2021.weakref" />
import { test, expect, vitest } from "vitest";
import v8 from "node:v8";
import vm from "node:vm";
import { makeFlow } from "@player-ui/make-flow";
import { Player } from "../../..";
import type { InProgressState } from "../../../types";

v8.setFlagsFromString("--expose-gc");
const gc: () => void = vm.runInNewContext("gc");

test("releases the nodes that later updates of a view replace", async () => {
  const player = new Player();
  /** The nodes each update re-resolved, held weakly */
  const resolvedByUpdate: Array<Array<WeakRef<object>>> = [];
  let renderedCount: unknown;

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
    view.hooks.onUpdate.tap("test", (resolved) => {
      renderedCount = resolved.value;
    });
  });

  player.start(makeFlow({ id: "count", type: "text", value: "{{count}}" }));
  const { controllers } = player.getState() as InProgressState;

  for (let count = 1; count <= 20; count += 1) {
    controllers.data.set([["count", count]]);
    await vitest.waitFor(() => expect(String(renderedCount)).toBe(`${count}`));
  }

  // WeakRef targets stay alive until the current job ends.
  await new Promise((resolve) => setTimeout(resolve, 0));
  gc();

  // The first update's nodes that don't read `count` are still current, and
  // the last update's nodes are the view on screen.
  const replaced = resolvedByUpdate.slice(1, -1).flat();
  expect(replaced.length).toBeGreaterThan(0);
  expect(replaced.filter((ref) => ref.deref() !== undefined)).toHaveLength(0);
});
