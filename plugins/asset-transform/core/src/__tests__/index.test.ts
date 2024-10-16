import { test, expect, vitest } from "vitest";
import type { InProgressState, TransformRegistry } from "@player-ui/player";
import { waitFor } from "@testing-library/react";
import { Player } from "@player-ui/player";
import type { Flow } from "@player-ui/types";
import { Registry } from "@player-ui/partial-match-registry";
import {
  AssetTransformPlugin,
  compose,
  composeBefore,
  propertiesToSkipTransform,
} from "..";

const basicContentWithActions: Flow<any> = {
  id: "test-flow",
  views: [
    {
      id: "my-view",
      actions: [
        {
          asset: {
            id: "next-label-action",
            type: "action",
            value: "{{foo.bar}}",
          },
        },
      ],
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "my-view",
        transitions: {},
      },
    },
  },
};

const basicFRFWithActionsAndExpressions = (asset = "action"): Flow<any> => ({
  id: "test-flow",
  views: [
    {
      id: "my-view",
      actions: [
        {
          asset: {
            id: "next-label-action",
            type: asset,
            value: "{{foo.bar}}",
            example: ['{{foo.bar}} = "test"'],
          },
        },
      ],
    },
  ],
  data: {
    foo: {
      bar: "1",
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "my-view",
        transitions: {},
      },
    },
  },
});

const otherAction: Flow<any> = {
  ...basicContentWithActions,
  views: [
    {
      id: "my-view",
      actions: [
        {
          asset: {
            id: "next-label-action",
            type: "stateful-action",
          },
        },
      ],
    },
  ],
};

const choice: Flow<any> = {
  id: "some view",
  views: [
    {
      id: "my-view",
      actions: [
        {
          asset: {
            id: "choice",
            type: "choice",
            value: "some value",
            choiceDetail: {
              asset: {
                id: "choiceDetail",
                type: "choiceItem",
                value: "choice detail",
              },
            },
          },
        },
      ],
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "my-view",
        transitions: {},
      },
    },
  },
};

const registry: TransformRegistry = new Registry();
registry.set({ type: "action" }, (asset, options) => {
  return {
    ...asset,
    run: () => {
      options.data.model.set([["foo.bar", "it worked!"]]);
    },
  };
});
registry.set(
  { type: "action-2" },
  compose(
    (asset, options) => {
      return {
        ...asset,
        run: () => {
          options.data.model.set([["foo.bar", "it worked!"]]);
        },
      };
    },
    composeBefore(propertiesToSkipTransform(["example"])),
  ),
);

registry.set({ type: "stateful-action" }, (asset, options, store) => {
  const [count, setCount] = store.useLocalState(1);
  const [label] = store.useLocalState("some text");

  return {
    ...asset,
    count,
    label,
    increment() {
      setCount(Math.min(count + 1, 2));
    },
  };
});

registry.set(
  { type: "choice" },
  {
    beforeResolve: (asset, options, store) => {
      store.useSharedState("shared")("choice before resolve");
      store.useLocalState(5);

      return {
        ...asset,
        children: [],
      };
    },
    resolve: (asset, options, store) => {
      const [count, setCount] = store.useLocalState(2);
      const [label, setLabel] = store.useSharedState("shared")("newValue");

      return {
        ...asset,
        count,
        label,
        after: () => {
          setCount(count + 1);
          setLabel("i can reset this");
        },
      };
    },
  },
);

test("transforms matching assets", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(basicContentWithActions);

  // Should now add a run function
  const view = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(typeof view?.actions[0].asset.run).toBe("function");
});

test("transforms matching assets and does not skip string resolution", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(basicFRFWithActionsAndExpressions());

  // Should now add a run function
  const view = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;

  expect(typeof view?.actions[0].asset.run).toBe("function");
  expect(view?.actions[0].asset.example).toStrictEqual(['1 = "test"']);
});

test("transforms matching assets and skips string resolution", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(basicFRFWithActionsAndExpressions("action-2"));

  // Should now add a run function
  const view = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;

  expect(typeof view?.actions[0].asset.run).toBe("function");
  expect(view?.actions[0].asset.example).toStrictEqual([
    '{{foo.bar}} = "test"',
  ]);
});

test("uses shorthand version", () => {
  const player = new Player({
    plugins: [
      new AssetTransformPlugin([
        [
          { type: "action" },
          (asset, options) => {
            return {
              ...asset,
              run: () => {
                options.data.model.set([["foo.bar", "it worked!"]]);
              },
            };
          },
        ],
      ]),
    ],
  });
  player.start(basicContentWithActions);

  // Should now add a run function
  const view = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(typeof view?.actions[0].asset.run).toBe("function");
});

test("transforms matching assets with all transform types", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(choice);

  // Should now add a run function
  const view = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;

  expect(typeof view?.actions[0].asset.choiceDetail).toBe("undefined");
  expect(typeof view?.actions[0].asset.after).toBe("function");
});

test("keeps same transform when data stays the same", async () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(basicContentWithActions);

  // Should now add a run function
  const initialView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;

  expect(initialView?.actions[0].asset.value).toBe(undefined);
  initialView?.actions[0].asset.run();

  let updatedView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  await waitFor(() => {
    updatedView = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;
    expect(updatedView?.actions[0].asset.value).toBe("it worked!");
  });

  expect(updatedView?.actions[0].asset.value).toBe("it worked!");

  updatedView?.actions[0].asset.run();
  const nonUpdatedView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(nonUpdatedView).toBe(updatedView);
});

test("updates when the transform store updates", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(otherAction);

  // Should now have the count and an increment function
  const initialView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(initialView?.actions[0].asset.count).toBe(1);

  expect(initialView?.actions[0].asset.label).toBe("some text");

  initialView?.actions[0].asset.increment();

  const updatedView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(updatedView?.actions[0].asset.count).toBe(2);
  updatedView?.actions[0].asset.increment();

  const nonUpdatedView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(nonUpdatedView).toBe(updatedView);
});

test("uses the same store", () => {
  const player = new Player({ plugins: [new AssetTransformPlugin(registry)] });
  player.start(choice);

  // Should now have the count and an increment function
  const initialView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(initialView?.actions[0].asset.count).toBe(2);
  expect(initialView?.actions[0].asset.label).toBe("choice before resolve");
  initialView?.actions[0].asset.after();

  const updatedView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;
  expect(updatedView?.actions[0].asset.count).toBe(3);
  expect(updatedView?.actions[0].asset.label).toBe("i can reset this");
});

test("merges registries", () => {
  const actionFn1 = vitest.fn();
  const actionFn2 = vitest.fn();

  const player = new Player({
    plugins: [
      new AssetTransformPlugin([[{ type: "action" }, actionFn1]]),
      new AssetTransformPlugin([[{ type: "action" }, actionFn2]]),
    ],
  });

  player.start(basicContentWithActions);
  const { transformRegistry } = (player.getState() as InProgressState)
    .controllers.view;

  const transform = transformRegistry.get({ type: "action" });
  transform?.resolve?.({}, {} as any, {} as any);

  expect(actionFn1).not.toHaveBeenCalled();
  expect(actionFn2).toHaveBeenCalled();
});
