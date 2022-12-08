import { waitFor } from '@testing-library/react';
import type { DataController, InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { Flow } from '@player-ui/types';
import { DataChangeListenerPlugin } from './index';

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
    dataController.set([['name.first', 'Frodo']]);
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
    dataController.set([['name.last', 'Dierkens']]);
    expect(testExpression).toHaveBeenCalledWith('hello Dierkens');
  });

  it('should call the listener for each item when a sub-item changes', () => {
    dataController.set([['person.1.name', 'Frodo']]);
    expect(testExpression).toHaveBeenCalledWith(1);
  });

  it('should skip nested, incorrect bindings', () => {
    dataController.set([['person.1.fruit', 'Frodo']]);
    expect(testExpression).not.toHaveBeenCalled();
  });

  it('should sub out nested bindings', () => {
    dataController.set([['nested.2.name.3.other', 'Frodo']]);
    expect(testExpression).toHaveBeenCalledWith(2, 3);
  });

  it('should not trigger when a silent update is sent', () => {
    dataController.set(['name.first', 'New Value'], { silent: true });
    expect(testExpression).not.toHaveBeenCalled();
  });
});
