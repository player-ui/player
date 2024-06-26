import { expect, test } from "vitest";
import { Node, InProgressState, ViewInstance } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { waitFor } from "@testing-library/react";
import { AsyncNodePlugin, AsyncNodePluginPlugin } from "./index";

const basicFRFWithActions = {
  id: "test-flow",
  views: [
    {
      id: "my-view",
      actions: [
        {
          asset: {
            id: "action-0",
            type: "action",
            value: "{{foo.bar}}",
          },
        },
        {
          id: "nodeId",
          async: "true",
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

const asyncNodeTest = async (resolvedValue: any) => {
  const plugin = new AsyncNodePlugin({
    plugins: [new AsyncNodePluginPlugin()],
  });

  let deferredResolve: ((value: any) => void) | undefined;

  plugin.hooks.onAsyncNode.tap('test', async (node: Node.Async) => {
    return new Promise((resolve) => {
      deferredResolve = resolve; // Promise would be resolved only once
    });
  });

  let updateNumber = 0;

  const player = new Player({ plugins: [plugin] });

  let viewInstance: ViewInstance | undefined;

  player.hooks.viewController.tap("async-node-test", (vc) => {
    vc.hooks.view.tap("async-node-test", (view) => {
      viewInstance = view;
      view.hooks.onUpdate.tap("async-node-test", () => {
        updateNumber++;
      });
    });
  });

  player.start(basicFRFWithActions as any);

  let view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view).toBeDefined();
  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1]).toBeUndefined();

  await waitFor(() => {
    expect(deferredResolve).toBeDefined();
  });

  // Consumer responds with null/undefined
  if (deferredResolve) {
    deferredResolve(resolvedValue);
  }

  await waitFor(() => {
    expect(updateNumber).toBe(2);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions.length).toBe(1);

  viewInstance.update();

  await waitFor(() => {
    expect(updateNumber).toBe(3);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions.length).toBe(1);
};

test("should return current node view when the resolved node is null", async () => {
  await asyncNodeTest(null);
});

test("should return current node view when the resolved node is undefined", async () => {
  await asyncNodeTest(undefined);
});

test("replaces async nodes with provided node", async () => {
  const plugin = new AsyncNodePlugin({
    plugins: [new AsyncNodePluginPlugin()],
  });

  let deferredResolve: ((value: any) => void) | undefined;

  plugin.hooks.onAsyncNode.tap("test", async (node: Node.Node) => {
    return new Promise((resolve) => {
      deferredResolve = resolve;
    });
  });
  let updateNumber = 0;

  const player = new Player({ plugins: [plugin] });

  player.hooks.viewController.tap("async-node-test", (vc) => {
    vc.hooks.view.tap("async-node-test", (view) => {
      view.hooks.onUpdate.tap("async-node-test", (update) => {
        updateNumber++;
      });
    });
  });

  player.start(basicFRFWithActions as any);

  let view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view).toBeDefined();
  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1]).toBeUndefined();
  expect(updateNumber).toBe(1);

  await waitFor(() => {
    expect(deferredResolve).toBeDefined();
  });

  if (deferredResolve) {
    deferredResolve({
      asset: {
        id: "next-label-action",
        type: "action",
        value: "dummy value",
      },
    });
  }

  await waitFor(() => {
    expect(updateNumber).toBe(2);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("action");
});

test("replaces async nodes with multi node", async () => {
  const plugin = new AsyncNodePlugin({
    plugins: [new AsyncNodePluginPlugin()],
  });

  let deferredResolve: ((value: any) => void) | undefined;

  plugin.hooks.onAsyncNode.tap("test", async (node) => {
    return new Promise((resolve) => {
      deferredResolve = resolve;
    });
  });

  let updateNumber = 0;

  const player = new Player({ plugins: [plugin] });

  player.hooks.viewController.tap("async-node-test", (vc) => {
    vc.hooks.view.tap("async-node-test", (view) => {
      view.hooks.onUpdate.tap("async-node-test", (update) => {
        updateNumber++;
      });
    });
  });

  player.start(basicFRFWithActions as any);

  let view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view).toBeDefined();
  expect(view?.actions[1]).toBeUndefined();
  expect(updateNumber).toBe(1);

  await waitFor(() => {
    expect(deferredResolve).toBeDefined();
  });

  if (deferredResolve) {
    deferredResolve([
      {
        asset: {
          id: "value-1",
          type: "text",
          value: "1st value in the multinode",
        },
      },
      {
        asset: {
          id: "value-2",
          type: "text",
          value: "2nd value in the multinode",
        },
      },
    ]);
  }

  await waitFor(() => {
    expect(updateNumber).toBe(2);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("text");
  expect(view?.actions[2].asset.type).toBe("text");
});

test("replaces async nodes with chained multiNodes", async () => {
  const plugin = new AsyncNodePlugin({
    plugins: [new AsyncNodePluginPlugin()],
  });

  let deferredResolve: ((value: any) => void) | undefined;

  plugin.hooks.onAsyncNode.tap('test', async (node: Node.Async) => {
    return new Promise((resolve) => {
      deferredResolve = resolve;
    });
  });
  let updateNumber = 0;

  const player = new Player({ plugins: [plugin] });

  player.hooks.viewController.tap("async-node-test", (vc) => {
    vc.hooks.view.tap("async-node-test", (view) => {
      view.hooks.onUpdate.tap("async-node-test", (update) => {
        updateNumber++;
      });
    });
  });

  player.start(basicFRFWithActions as any);

  let view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view).toBeDefined();
  expect(view?.actions[1]).toBeUndefined();

  await waitFor(() => {
    expect(updateNumber).toBe(1);
    expect(deferredResolve).toBeDefined();
  });

  if (deferredResolve) {
    deferredResolve([
      {
        asset: {
          id: "value-1",
          type: "text",
          value: "1st value in the multinode",
        },
      },
      {
        id: "another-async",
        async: true,
      },
    ]);
  }

  await waitFor(() => {
    expect(updateNumber).toBe(2);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("text");
  expect(view?.actions[2]).toBeUndefined();
  expect(updateNumber).toBe(2);

  if (deferredResolve) {
    deferredResolve([
      {
        asset: {
          id: "value-2",
          type: "text",
          value: "2nd value in the multinode",
        },
      },
      {
        asset: {
          id: "value-3",
          type: "text",
          value: "3rd value in the multinode",
        },
      },
    ]);
  }

  await waitFor(() => {
    expect(updateNumber).toBe(3);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("text");
  expect(view?.actions[2].asset.type).toBe("text");
  expect(view?.actions[3].asset.type).toBe("text");
});

test("replaces async nodes with chained multiNodes singular", async () => {
  const plugin = new AsyncNodePlugin({
    plugins: [new AsyncNodePluginPlugin()],
  });

  let deferredResolve: ((value: any) => void) | undefined;

  plugin.hooks.onAsyncNode.tap('test', async (node: Node.Async) => {
    return new Promise((resolve) => {
      deferredResolve = resolve;
    });
  });
  let updateNumber = 0;

  const player = new Player({ plugins: [plugin] });

  player.hooks.viewController.tap("async-node-test", (vc) => {
    vc.hooks.view.tap("async-node-test", (view) => {
      view.hooks.onUpdate.tap("async-node-test", (update) => {
        updateNumber++;
      });
    });
  });

  player.start(basicFRFWithActions as any);

  let view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view).toBeDefined();
  expect(view?.actions[1]).toBeUndefined();

  await waitFor(() => {
    expect(updateNumber).toBe(1);
    expect(deferredResolve).toBeDefined();
  });

  if (deferredResolve) {
    deferredResolve([
      {
        asset: {
          id: "value-1",
          type: "text",
          value: "1st value in the multinode",
        },
      },
      {
        id: "another-async",
        async: true,
      },
    ]);
  }

  await waitFor(() => {
    expect(updateNumber).toBe(2);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("text");
  expect(view?.actions[2]).toBeUndefined();

  if (deferredResolve) {
    deferredResolve({
      asset: {
        id: "value-2",
        type: "text",
        value: "2nd value in the multinode",
      },
    });
  }

  await waitFor(() => {
    expect(updateNumber).toBe(3);
  });

  view = (player.getState() as InProgressState).controllers.view.currentView
    ?.lastUpdate;

  expect(view?.actions[0].asset.type).toBe("action");
  expect(view?.actions[1].asset.type).toBe("text");
  expect(view?.actions[2].asset.type).toBe("text");
});

test('should call onAsyncNode hook when async node is encountered', async () => {
  const plugin = new AsyncNodePlugin();
  let localNode: Node.Async;
  plugin.hooks.onAsyncNode.tap('test', async (node: Node.Async) => {
    if (node !== null) {
      // assigns node value to a local variable
      localNode = node;
    }

    return new Promise((resolve) => {
      resolve('Promise resolved');
    });
  });

  const player = new Player({ plugins: [plugin] });

  player.start(basicFRFWithActions as any);

  await waitFor(() => {
    expect(localNode.id).toStrictEqual('uhh');
    expect(localNode.type).toStrictEqual('async');
  });
});
