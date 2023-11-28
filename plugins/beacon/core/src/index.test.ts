import { expect, test, vitest } from "vitest";
import type { InProgressState, FlowController, Asset } from "@player-ui/player";
import { waitFor } from "@testing-library/react";
import { Player } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";
import type { BeaconPluginPlugin } from ".";
import { BeaconPlugin } from ".";

const minimal = {
  id: "minimal",
  views: [
    {
      id: "view-1",
      type: "info",
    },
    {
      id: "view-2",
      type: "info",
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      VIEW_1: {
        ref: "view-1",
        state_type: "VIEW",
        transitions: {
          Next: "VIEW_2",
          "*": "END_Done",
        },
      },
      VIEW_2: {
        ref: "view-2",
        state_type: "VIEW",
        transitions: {
          "*": "END_Done",
        },
      },
      startState: "VIEW_1",
    },
  },
};

const asset: Asset = {
  id: "foo-1",
  type: "action",
};

test("tracks view changes", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });

  let flowController: FlowController | undefined;

  const player = new Player({ plugins: [beaconPlugin] });

  player.hooks.flowController.tap("test", (fc) => {
    flowController = fc;
  });

  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].viewId).toBe("view-1");

  flowController?.transition("Next");

  await waitFor(() => expect(handler.mock.calls).toHaveLength(2));
  expect(handler.mock.calls[1][0].viewId).toBe("view-2");
});

test("adds an expression", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });
  const player = new Player({ plugins: [beaconPlugin] });

  const content = {
    ...minimal,
    navigation: {
      ...minimal.navigation,
      FLOW_1: {
        onStart: 'beacon("some-event", "some-data")',
        ...minimal.navigation.FLOW_1,
      },
    },
  };

  player.start(content as any);

  await waitFor(() => expect(handler.mock.calls).toHaveLength(2));
  expect(handler.mock.calls[0][0].action).toBe("some-event");
  expect(handler.mock.calls[0][0].data).toBe("some-data");
});

test("automatically beacons view changes", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });

  let flowController: FlowController | undefined;

  const player = new Player({ plugins: [beaconPlugin] });

  player.hooks.flowController.tap("test", (fc) => {
    flowController = fc;
  });

  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].action).toBe("viewed");
  expect(handler.mock.calls[0][0].viewId).toBe("view-1");

  flowController?.transition("Next");

  await waitFor(() => expect(handler.mock.calls).toHaveLength(2));
  expect(handler.mock.calls[1][0].action).toBe("viewed");
  expect(handler.mock.calls[1][0].viewId).toBe("view-2");
});

test("allows you to modify the beacon format", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });

  beaconPlugin.hooks.buildBeacon.tap(
    "TestPlugin",
    (beacon: any, options: any) => {
      const b = options;
      b.foo = "bar";

      return b;
    },
  );

  const player = new Player({ plugins: [beaconPlugin] });
  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].foo).toBe("bar");
});

test("cancels specific beacons using hooks", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });

  beaconPlugin.hooks.cancelBeacon.tap("TestPlugin", (options) => {
    if (options?.view?.id === "view-1") {
      return true;
    }

    return false;
  });

  let flowController: FlowController | undefined;

  const player = new Player({ plugins: [beaconPlugin] });

  player.hooks.flowController.tap("test", (fc) => {
    flowController = fc;
  });

  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  beaconPlugin.beacon({ action: "clicked", element: "button", asset });

  await waitFor(() => expect(handler.mock.calls).toHaveLength(0));

  flowController?.transition("Next");

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].viewId).toBe("view-2");
});

test("allows you to add plugins via arguments", async () => {
  const handler = vitest.fn();

  class BeaconModifyPlugin implements BeaconPluginPlugin {
    apply(beaconPlugin: BeaconPlugin) {
      beaconPlugin.hooks.buildBeacon.tap(
        "ModifyPlugin",
        (beacon: any, options: any) => {
          const b = options;
          b.foo = "bar";

          return b;
        },
      );
    }
  }

  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [new BeaconModifyPlugin()],
  });

  const player = new Player({ plugins: [beaconPlugin] });
  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].foo).toBe("bar");
});

test("gives you access to the asset, view, and state", async () => {
  const handler = vitest.fn();

  class BeaconModifyPlugin implements BeaconPluginPlugin {
    apply(beaconPlugin: BeaconPlugin) {
      beaconPlugin.hooks.buildBeacon.tap(
        "ModifyPlugin",
        async (beacon, beaconOptions) => {
          expect(beaconOptions.asset.id).toBe("view-1");
          expect(beaconOptions.state?.status).toBe("in-progress");
          expect(beaconOptions.view?.id).toBe("view-1");

          return beacon;
        },
      );
    }
  }

  class BeaconCancelPlugin implements BeaconPluginPlugin {
    apply(beaconPlugin: BeaconPlugin) {
      beaconPlugin.hooks.cancelBeacon.tap("CancelPlugin", (beacon) => {
        expect(beacon.state?.status).toBe("in-progress");
        expect(beacon.asset.id).toBe("view-1");
        expect(beacon.view?.id).toBe("view-1");

        return false;
      });
    }
  }

  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [new BeaconModifyPlugin(), new BeaconCancelPlugin()],
  });

  const player = new Player({ plugins: [beaconPlugin] });
  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].assetId).toBe("view-1");
});

test("gives you access to the logger", async () => {
  const handler = vitest.fn();

  class BeaconModifyPlugin implements BeaconPluginPlugin {
    apply(beaconPlugin: BeaconPlugin) {
      beaconPlugin.hooks.buildBeacon.tap(
        "ModifyPlugin",
        async (beacon, beaconOptions) => {
          expect(beaconOptions.logger?.trace).toBeDefined();
          return beacon;
        },
      );
    }
  }

  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [new BeaconModifyPlugin()],
  });

  const player = new Player({ plugins: [beaconPlugin] });
  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].assetId).toBe("view-1");
});

test("Allows you to access beacons via a plugin", async () => {
  const handler = vitest.fn();

  const beaconPlugin = new BeaconPlugin();

  beaconPlugin.hooks.publishBeacon.tap("TestPlugin", handler);
  const player = new Player({ plugins: [beaconPlugin] });

  player.start(minimal as any);

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  beaconPlugin.beacon({ action: "clicked", element: "button", asset });

  await waitFor(() => expect(handler.mock.calls).toHaveLength(2));
});

test("waits for expressions to resolve on view", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });
  const player = new Player({ plugins: [beaconPlugin] });

  player.start(
    makeFlow({
      id: "view",
      type: "view",
      metaData: {
        beacon: {
          count: "@[ 1 + 2 + 3]@",
        },
      },
    }),
  );

  vitest
    .spyOn(global.Date, "now")
    .mockImplementation(() => new Date("1993-05-08T11:01:58.135Z").valueOf());

  await waitFor(() => expect(handler.mock.calls).toHaveLength(1));
  expect(handler.mock.calls[0][0].data).toStrictEqual({ count: 6 });
});

test("skips resolving beacon expressions", async () => {
  const handler = vitest.fn();
  const beaconPlugin = new BeaconPlugin({ callback: handler });
  const player = new Player({ plugins: [beaconPlugin] });

  player.start(
    makeFlow({
      id: "view",
      type: "view",
      metaData: {
        shouldNotSkip: "@[1 + 2 + 3]@",
        beacon: {
          count: "@[1 + 2 + 3]@",
        },
      },
      test: {
        asset: {
          id: "input",
          type: "input",
          beacon: "{{foo}}",
        },
      },
    }),
  );

  const state = player.getState() as InProgressState;

  const lastUpdate = state.controllers.view.currentView?.lastUpdate;

  expect(lastUpdate).toMatchObject({
    metaData: {
      shouldNotSkip: 6,
      beacon: {
        count: "@[1 + 2 + 3]@",
      },
    },
    test: {
      asset: {
        beacon: "{{foo}}",
      },
    },
  });
});

test("provides resolved values in hooks", async () => {
  const handler = vitest.fn();
  const beaconPluginPlugin: BeaconPluginPlugin = {
    apply(beaconPlugin: BeaconPlugin): void {
      beaconPlugin.hooks.buildBeacon.tap("test", async (beacon) => {
        await handler(beacon);
        return beacon;
      });
    },
  };

  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [beaconPluginPlugin],
  });
  const player = new Player({ plugins: [beaconPlugin] });

  player.start(
    makeFlow({
      id: "view",
      type: "view",
      metaData: {
        beacon: {
          count: "@[1 + 2 + 3]@",
        },
      },
    }),
  );

  const state = player.getState() as InProgressState;

  const view = state.controllers.view.currentView?.lastUpdate as Asset;

  beaconPlugin.beacon({ asset: view, action: "viewed", element: "test" });

  await waitFor(() => {
    expect(handler.mock.calls[0][0]).toMatchObject({
      data: { count: 6 },
    });
  });
});

test("re-resolves new values before sending beacon event", async () => {
  const handler = vitest.fn();
  const beaconPluginPlugin: BeaconPluginPlugin = {
    apply(beaconPlugin: BeaconPlugin): void {
      beaconPlugin.hooks.buildBeacon.tap("test", (beacon: any) => {
        return {
          ...beacon,
          customData: "{{foo.bar}}",
        };
      });
    },
  };

  const beaconPlugin = new BeaconPlugin({
    callback: handler,
    plugins: [beaconPluginPlugin],
  });
  const player = new Player({ plugins: [beaconPlugin] });
  const flow = makeFlow({
    id: "view",
    type: "view",
    metaData: {
      beacon: {
        count: "@[1 + 2 + 3]@",
      },
    },
  });

  player.start({
    ...flow,
    data: {
      foo: {
        bar: "customTestValue",
      },
    },
  });

  await waitFor(() => {
    expect(handler).toBeCalledTimes(1);
  });

  await waitFor(() => {
    expect(handler.mock.calls[0][0]).toMatchObject({
      data: { count: 6 },
      customData: "customTestValue",
    });
  });
});
