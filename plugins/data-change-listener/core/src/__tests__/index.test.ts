import { vitest, describe, expect, it, beforeEach, Mock } from "vitest";
import type {
  DataController,
  InProgressState,
  TransformFunction,
  Flow,
} from "@player-ui/player";
import { Player } from "@player-ui/player";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { AssetTransformPlugin } from "@player-ui/asset-transform-plugin";
import { Registry } from "@player-ui/partial-match-registry";
import { DataChangeListenerPlugin } from "../index";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin";
import { CommonExpressionsPlugin } from "@player-ui/common-expressions-plugin";

/** Test transform function to add validation to asset */
const transform: TransformFunction = (asset: any, options: any) => {
  return {
    ...asset,
    set(val: any) {
      if (asset.binding === undefined) {
        return;
      }

      return options.data.model.set([[asset.binding, val]], {
        formatted: true,
      });
    },
    validation:
      asset.binding === undefined
        ? undefined
        : options.validation?.get(asset.binding, { track: true }),
  };
};

const dataChangeFlow: Flow = {
  id: "test-flow",
  data: {
    name: {
      first: "john",
      last: "smith",
    },
  },
  views: [
    {
      id: "view-1",
      type: "view",
      fields: {
        asset: {
          id: "input-1",
          type: "input",
          binding: "name.first",
        },
      },
      listeners: {
        "dataChange.name.first": ["test('hello ' + {{name.first}})"],
        "dataChange.name.last": ["test('goodbye ' + {{name.last}}"],
        "dataChange.person._.name": ["test(_index_)"],
        "dataChange.nested._.name._.other": ["test(_index_, _index1_)"],
      },
    },
    {
      id: "view-2",
      type: "view",
      listeners: {
        "dataChange.name.last": ["test('hello ' + {{name.last}})"],
      },
    },
  ],
  schema: {
    ROOT: {
      name: {
        type: "nameType",
      },
    },
    nameType: {
      first: {
        type: "StringType",
        validation: [
          {
            param: "^[a-zA-Z]*$",
            type: "regex",
          },
        ],
      },
      last: {
        type: "StringType",
      },
    },
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "ACTION_1",
        },
      },
      ACTION_1: {
        state_type: "ACTION",
        exp: ['{{name.first}} = "Frodo"', '{{name.last}} = "Baggins"'],
        transitions: {
          "*": "VIEW_2",
        },
      },
      VIEW_2: {
        state_type: "VIEW",
        ref: "view-2",
        transitions: {
          "*": "ACTION_1",
        },
      },
    },
  },
};

describe("Data-Change-Listener", () => {
  let player: Player;
  let dataController: DataController;
  let testExpression: Mock<any, any>;

  beforeEach(() => {
    player = new Player({
      plugins: [new DataChangeListenerPlugin()],
    });

    testExpression = vitest.fn();

    player.hooks.expressionEvaluator.tap("test", (ev) => {
      ev.addExpressionFunction("test", (context, ...args) => {
        testExpression(...args);
      });
    });

    player.hooks.dataController.tap("test", (dc) => {
      dataController = dc;
    });

    player.start(dataChangeFlow);
  });

  it("should ignore fields that are not tracked", () => {
    dataController.set([["name.middle", "Christopher"]]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it("should not call evaluate if field does not change", () => {
    dataController.set([["name.first", "john"]]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it("should call expression evaluator when a field that is tracked changes", () => {
    dataController.set([["name.first", "Frodo"]], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith("hello Frodo");
  });

  it("should forget about listeners when transitioning", () => {
    const state = player.getState() as InProgressState;
    state.controllers.flow.transition("next");
    expect(testExpression).not.toHaveBeenCalled();
  });

  it("should forget about listeners on a new view", async () => {
    const state = player.getState() as InProgressState;
    state.controllers.flow.transition("next");

    await vitest.waitFor(() => {
      expect(state.controllers.flow.current?.currentState?.name).toBe("VIEW_2");
    });

    await vitest.waitFor(() => expect(testExpression).not.toHaveBeenCalled());
    dataController.set([["name.last", "smith"]], {
      context: {
        model: dataController.getModel(),
      },
    });

    await vitest.waitFor(() => {
      expect(testExpression).toHaveBeenCalledWith("hello smith");
    });
  });

  it("should call the listener for each item when a sub-item changes", () => {
    dataController.set([["person.1.name", "Frodo"]], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith(1);
  });

  it("should skip nested, incorrect bindings", () => {
    dataController.set([["person.1.fruit", "Frodo"]]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it("should sub out nested bindings", () => {
    dataController.set([["nested.2.name.3.other", "Frodo"]], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith(2, 3);
  });

  it("should not trigger when a silent update is sent", () => {
    dataController.set(["name.first", "New Value"], { silent: true });
    expect(testExpression).not.toHaveBeenCalled();
  });
});

describe("Data-Change-Listener with Validations", () => {
  let player: Player;
  let testExpression: Mock<any, any>;

  const flow: Flow = {
    id: "test-flow",
    data: {
      name: {
        first: "Mjohn",
        last: "smith",
      },
    },
    views: [
      {
        id: "view-1",
        type: "info",
        fields: {
          asset: {
            id: "input",
            type: "input",
            binding: "name.first",
          },
        },
        listeners: {
          "dataChange.name.first": ["test('hello ' + {{name.first}})"],
          "dataChange.name.last": ["test('goodbye ' + {{name.last}}"],
          "dataChange.person._.name": ["test(_index_)"],
          "dataChange.nested._.name._.other": ["test(_index_, _index1_)"],
        },
        validation: [
          {
            ref: "name.first",
            type: "expression",
            exp: '{{name.first}} == "john"',
            message: "john is always the right option",
            trigger: "change",
          },
        ],
      },
      {
        id: "view-2",
        type: "view",
        listeners: {
          "dataChange.name.last": ["test('hello ' + {{name.last}})"],
        },
      },
    ],
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            "*": "ACTION_1",
          },
        },
        ACTION_1: {
          state_type: "ACTION",
          exp: ['{{name.first}} = "Frodo"', '{{name.last}} = "Baggins"'],
          transitions: {
            "*": "VIEW_2",
          },
        },
        VIEW_2: {
          state_type: "VIEW",
          ref: "view-2",
          transitions: {
            "*": "ACTION_1",
          },
        },
      },
    },
  };

  /** Helper function to get current Player state */
  function getState() {
    return player.getState() as InProgressState;
  }

  /** Helper function to get the first asset in the current view */
  function getInputAsset() {
    return getState().controllers.view.currentView?.lastUpdate?.fields.asset;
  }

  const getCurrentView = () => {
    return getState().controllers.view.currentView;
  };

  beforeEach(() => {
    player = new Player({
      plugins: [
        new CommonTypesPlugin(),
        new DataChangeListenerPlugin(),
        new AssetTransformPlugin(
          new Registry([[{ type: "input" }, transform]]),
        ),
      ],
    });

    testExpression = vitest.fn();

    player.hooks.expressionEvaluator.tap("test", (ev) => {
      ev.addExpressionFunction("test", (context, ...args) => {
        testExpression(...args);
      });
    });

    player.start(flow);
  });

  it("bindings with a value that failed validation do not trigger listeners", async () => {
    expect(getInputAsset().validation).toBe(undefined);

    getInputAsset().set("johnjohn");
    await vitest.waitFor(() => {
      expect(getInputAsset().validation).toBeDefined();
      expect(testExpression).not.toHaveBeenCalled();
    });
  });

  it("bindings with a successful validation trigger listeners", async () => {
    expect(getInputAsset().validation).toBe(undefined);

    getInputAsset().set("john");
    await vitest.waitFor(() => {
      expect(getInputAsset().validation).not.toBeDefined();
      expect(testExpression).toHaveBeenCalled();
    });
  });

  it("removes listeners section after resolving", () => {
    expect(getCurrentView()?.initialView?.listeners).toBeUndefined();
  });
});

describe("Data-Change-Listener that are chained", () => {
  let player: Player;
  let dataController: DataController;
  let testExpression: Mock<any, any>;

  const flow: Flow = {
    id: "test-flow",
    data: {
      name: {
        first: "",
        second: "",
        third: "",
      },
    },
    views: [
      {
        id: "view-1",
        type: "info",
        fields: {
          asset: {
            id: "input",
            type: "input",
            binding: "name.first",
          },
        },
        listeners: {
          "dataChange.name.first": ["{{name.second}} = 'update 1'"],
          "dataChange.name.second": ["{{name.third}} = 'update 2'"],
        },
      },
    ],
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            "*": "END",
          },
        },
      },
    },
  };

  beforeEach(() => {
    player = new Player({
      plugins: [
        new DataChangeListenerPlugin(),
        new AssetTransformPlugin(
          new Registry([[{ type: "input" }, transform]]),
        ),
      ],
    });

    testExpression = vitest.fn();

    player.hooks.expressionEvaluator.tap("test", (ev) => {
      ev.addExpressionFunction("test", (context, ...args) => {
        testExpression(...args);
      });
    });

    player.hooks.dataController.tap("test", (dc) => {
      dataController = dc;
    });

    player.start(flow);
  });

  function getState() {
    return player.getState() as InProgressState;
  }

  function getInputAsset() {
    return getState().controllers.view.currentView?.lastUpdate?.fields.asset;
  }

  it("chained listeners that set data trigger each other", async () => {
    getInputAsset().set("something");
    await vitest.waitFor(() => {
      expect(dataController.get("name.second")).toStrictEqual("update 1");
      expect(dataController.get("name.third")).toStrictEqual("update 2");
    });
  });
});

describe("Data-Change-Listener with array modification", () => {
  let player: Player;
  let testExpression: Mock<any, any>;

  const flow = {
    id: "action-with-expression",
    views: [
      {
        id: "root",
        type: "info",
        listeners: {
          "dataChange.array": ["test('array has changed ' + {{array}})"],
        },
        title: {
          asset: {
            id: "title",
            type: "text",
            value: "Hello",
          },
        },
        primaryInfo: {
          asset: {
            id: "primaryInfo",
            type: "text",
            value: "Collection: [{{array}}]",
          },
        },
        actions: [
          {
            asset: {
              id: "action",
              type: "action",
              exp: "{{array}} = concat({{array}}, [4])",
              label: {
                asset: {
                  id: "actions-0-label",
                  type: "text",
                  value: "Add to collection",
                },
              },
            },
          },
        ],
      },
    ],
    data: {
      array: [1, 2, 3],
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "root",
          transitions: {
            "*": "END_Done",
          },
        },
        END_Done: {
          state_type: "END",
          outcome: "done",
        },
      },
    },
  };

  const flowNum = {
    id: "action-with-expression",
    views: [
      {
        id: "root",
        type: "info",
        listeners: {
          "dataChange.count": ["test('count has changed ' + {{count}})"],
        },
        title: {
          asset: {
            id: "title",
            type: "text",
            value: "Hello",
          },
        },
        primaryInfo: {
          asset: {
            id: "primaryInfo",
            type: "text",
            value: "Count: {{count}}\\",
          },
        },
        actions: [
          {
            asset: {
              id: "action",
              type: "action",
              exp: "{{count}} = {{count}} + 1",
              label: {
                asset: {
                  id: "actions-0-label",
                  type: "text",
                  value: "Add to collection",
                },
              },
            },
          },
        ],
      },
    ],
    data: {
      count: 0,
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "root",
          transitions: {
            "*": "END_Done",
          },
        },
        END_Done: {
          state_type: "END",
          outcome: "done",
        },
      },
    },
  };

  /** Helper function to get current Player state */
  function getState() {
    return player.getState() as InProgressState;
  }

  it("should call expression evaluator and data change listener when an array that is tracked changes", () => {
    player = new Player({
      plugins: [
        new CommonTypesPlugin(),
        new DataChangeListenerPlugin(),
        new ReferenceAssetsPlugin(),
        new CommonExpressionsPlugin(),
      ],
    });

    testExpression = vitest.fn();

    player.hooks.expressionEvaluator.tap("test", (ev) => {
      ev.addExpressionFunction("test", (context, ...args) => {
        testExpression(...args);
      });
    });

    player.start(flow);

    const getCurrent = () => {
      const status = player.getState();
      if (status.status === "in-progress") {
        const view = status.controllers.view.currentView?.lastUpdate;
        if (view) {
          return view;
        }
      }
    };

    expect(getState().controllers.data.get("array")).toStrictEqual([1, 2, 3]);

    getCurrent()?.actions[0].asset.run();

    expect(getState().controllers.data.get("array")).toStrictEqual([
      1, 2, 3, 4,
    ]);

    expect(testExpression).toHaveBeenCalledWith("array has changed 1,2,3,4");
  });

  it("should call expression evaluator and data change listener when count is changes", () => {
    player = new Player({
      plugins: [
        new CommonTypesPlugin(),
        new DataChangeListenerPlugin(),
        new ReferenceAssetsPlugin(),
        new CommonExpressionsPlugin(),
      ],
    });

    testExpression = vitest.fn();

    player.hooks.expressionEvaluator.tap("test", (ev) => {
      ev.addExpressionFunction("test", (context, ...args) => {
        testExpression(...args);
      });
    });

    player.start(flowNum);

    const getCurrent = () => {
      const status = player.getState();
      if (status.status === "in-progress") {
        const view = status.controllers.view.currentView?.lastUpdate;
        if (view) {
          return view;
        }
      }
    };

    expect(getState().controllers.data.get("count")).toStrictEqual(0);

    getCurrent()?.actions[0].asset.run();

    expect(getState().controllers.data.get("count")).toStrictEqual(1);

    expect(testExpression).toHaveBeenCalledWith("count has changed 1");
  });
});
