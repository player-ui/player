import { waitFor } from '@testing-library/react';
import type {
  DataController,
  InProgressState,
  TransformFunction,
} from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { Flow } from '@player-ui/types';
import { CommonTypesPlugin } from '@player-ui/common-types-plugin';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { Registry } from '@player-ui/partial-match-registry';
import { DataChangeListenerPlugin } from './index';

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
  id: 'test-flow',
  data: {
    name: {
      first: 'Adam',
      last: 'Dierkens',
    },
  },
  views: [
    {
      id: 'view-1',
      type: 'view',
      fields: {
        asset: {
          id: 'input-1',
          type: 'input',
          binding: 'name.first',
        },
      },
      listeners: {
        'dataChange.name.first': ["test('hello ' + {{name.first}})"],
        'dataChange.name.last': ["test('goodbye ' + {{name.last}}"],
        'dataChange.person._.name': ['test(_index_)'],
        'dataChange.nested._.name._.other': ['test(_index_, _index1_)'],
      },
    },
    {
      id: 'view-2',
      type: 'view',
      listeners: {
        'dataChange.name.last': ["test('hello ' + {{name.last}})"],
      },
    },
  ],
  schema: {
    ROOT: {
      name: {
        type: 'nameType',
      },
    },
    nameType: {
      first: {
        type: 'StringType',
        validation: [
          {
            param: '^[a-zA-Z]*$',
            type: 'regex',
          },
        ],
      },
      last: {
        type: 'StringType',
      },
    },
  },
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'view-1',
        transitions: {
          '*': 'ACTION_1',
        },
      },
      ACTION_1: {
        state_type: 'ACTION',
        exp: ['{{name.first}} = "Frodo"', '{{name.last}} = "Baggins"'],
        transitions: {
          '*': 'VIEW_2',
        },
      },
      VIEW_2: {
        state_type: 'VIEW',
        ref: 'view-2',
        transitions: {
          '*': 'ACTION_1',
        },
      },
    },
  },
};

describe('Data-Change-Listener', () => {
  let player: Player;
  let dataController: DataController;
  let testExpression: jest.Mock<any, any>;

  beforeEach(() => {
    player = new Player({
      plugins: [new DataChangeListenerPlugin()],
    });

    testExpression = jest.fn();

    player.hooks.expressionEvaluator.tap('test', (ev) => {
      ev.addExpressionFunction('test', (context, ...args) => {
        testExpression(...args);
      });
    });

    player.hooks.dataController.tap('test', (dc) => {
      dataController = dc;
    });

    player.start(dataChangeFlow);
  });

  it('should ignore fields that are not tracked', () => {
    dataController.set([['name.middle', 'Christopher']]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it('should not call evaluate if field does not change', () => {
    dataController.set([['name.first', 'Adam']]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it('should call expression evaluator when a field that is tracked changes', () => {
    dataController.set([['name.first', 'Frodo']], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith('hello Frodo');
  });

  it('should forget about listeners when transitioning', () => {
    const state = player.getState() as InProgressState;
    state.controllers.flow.transition('next');
    expect(testExpression).not.toHaveBeenCalled();
  });

  it('should forget about listeners on a new view', async () => {
    const state = player.getState() as InProgressState;
    state.controllers.flow.transition('next');

    await waitFor(() => expect(testExpression).not.toHaveBeenCalled());
    dataController.set([['name.last', 'Dierkens']], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith('hello Dierkens');
  });

  it('should call the listener for each item when a sub-item changes', () => {
    dataController.set([['person.1.name', 'Frodo']], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith(1);
  });

  it('should skip nested, incorrect bindings', () => {
    dataController.set([['person.1.fruit', 'Frodo']]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it('should sub out nested bindings', () => {
    dataController.set([['nested.2.name.3.other', 'Frodo']], {
      context: {
        model: dataController.getModel(),
      },
    });
    expect(testExpression).toHaveBeenCalledWith(2, 3);
  });

  it('should not trigger when a silent update is sent', () => {
    dataController.set(['name.first', 'New Value'], { silent: true });
    expect(testExpression).not.toHaveBeenCalled();
  });
});

describe('Data-Change-Listener with Validations', () => {
  let player: Player;
  let testExpression: jest.Mock<any, any>;

  const flow: Flow = {
    id: 'test-flow',
    data: {
      name: {
        first: 'Madam',
        last: 'Dierkens',
      },
    },
    views: [
      {
        id: 'view-1',
        type: 'info',
        fields: {
          asset: {
            id: 'input',
            type: 'input',
            binding: 'name.first',
          },
        },
        listeners: {
          'dataChange.name.first': ["test('hello ' + {{name.first}})"],
          'dataChange.name.last': ["test('goodbye ' + {{name.last}}"],
          'dataChange.person._.name': ['test(_index_)'],
          'dataChange.nested._.name._.other': ['test(_index_, _index1_)'],
        },
        validation: [
          {
            ref: 'name.first',
            type: 'expression',
            exp: '{{name.first}} == "Adam"',
            message: 'Adam is always the right option',
            trigger: 'change',
          },
        ],
      },
      {
        id: 'view-2',
        type: 'view',
        listeners: {
          'dataChange.name.last': ["test('hello ' + {{name.last}})"],
        },
      },
    ],
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          ref: 'view-1',
          transitions: {
            '*': 'ACTION_1',
          },
        },
        ACTION_1: {
          state_type: 'ACTION',
          exp: ['{{name.first}} = "Frodo"', '{{name.last}} = "Baggins"'],
          transitions: {
            '*': 'VIEW_2',
          },
        },
        VIEW_2: {
          state_type: 'VIEW',
          ref: 'view-2',
          transitions: {
            '*': 'ACTION_1',
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
          new Registry([[{ type: 'input' }, transform]])
        ),
      ],
    });

    testExpression = jest.fn();

    player.hooks.expressionEvaluator.tap('test', (ev) => {
      ev.addExpressionFunction('test', (context, ...args) => {
        testExpression(...args);
      });
    });

    player.start(flow);
  });

  it('bindings with a value that failed validation do not trigger listeners', async () => {
    expect(getInputAsset().validation).toBe(undefined);

    getInputAsset().set('AdamAdam');
    waitFor(() => {
      expect(getInputAsset().validation).toBeDefined();
      expect(testExpression).not.toHaveBeenCalled();
    });
  });

  it('bindings with a successful validation trigger listeners', async () => {
    expect(getInputAsset().validation).toBe(undefined);

    getInputAsset().set('Adam');
    waitFor(() => {
      expect(getInputAsset().validation).not.toBeDefined();
      expect(testExpression).toHaveBeenCalled();
    });
  });

  it('removes listeners section after resolving', () => {
    expect(getCurrentView()?.initialView?.listeners).toBeUndefined();
  });
});

describe('Data-Change-Listener that are chained', () => {
  let player: Player;
  let dataController: DataController;
  let testExpression: jest.Mock<any, any>;

  const flow: Flow = {
    id: 'test-flow',
    data: {
      name: {
        first: '',
        second: '',
        third: '',
      },
    },
    views: [
      {
        id: 'view-1',
        type: 'info',
        fields: {
          asset: {
            id: 'input',
            type: 'input',
            binding: 'name.first',
          },
        },
        listeners: {
          'dataChange.name.first': ["{{name.second}} = 'update 1'"],
          'dataChange.name.second': ["{{name.third}} = 'update 2'"],
        },
      },
    ],
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'VIEW_1',
        VIEW_1: {
          state_type: 'VIEW',
          ref: 'view-1',
          transitions: {
            '*': 'END',
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
          new Registry([[{ type: 'input' }, transform]])
        ),
      ],
    });

    testExpression = jest.fn();

    player.hooks.expressionEvaluator.tap('test', (ev) => {
      ev.addExpressionFunction('test', (context, ...args) => {
        testExpression(...args);
      });
    });

    player.hooks.dataController.tap('test', (dc) => {
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

  it('chained listeners that set data trigger each other', async () => {
    getInputAsset().set('something');
    await waitFor(() => {
      expect(dataController.get('name.second')).toStrictEqual('update 1');
      expect(dataController.get('name.third')).toStrictEqual('update 2');
    });
  });
});
