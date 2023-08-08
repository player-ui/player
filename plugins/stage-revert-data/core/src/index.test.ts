import type { DataController, InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import type { Flow } from '@player-ui/types';
import { waitFor } from '@testing-library/dom';
import StageReverDataPlugin from './index';

const dataChangeFlow: Flow = {
  id: 'test-flow',
  data: {
    name: {
      first: 'Alex',
      last: 'Fimbres',
    },
  },
  views: [
    {
      id: 'view-1',
      type: 'view',
      value: '{{name.first}}',
    },
    {
      id: 'view-2',
      type: 'view',
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'VIEW_1',
      VIEW_1: {
        state_type: 'VIEW',
        ref: 'view-1',
        attributes: {
          stageData: true,
          commitTransitions: ['VIEW_2', 'ACTION_2'],
        },
        transitions: {
          next: 'VIEW_2',
          '*': 'ACTION_1',
        },
      },
      ACTION_1: {
        state_type: 'ACTION',
        exp: '',
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

describe('Stage-Revert-Data plugin', () => {
  let player: Player;
  let dataController: DataController;

  beforeEach(() => {
    player = new Player({
      plugins: [new StageReverDataPlugin()],
    });

    player.hooks.dataController.tap('test', (dc) => {
      dataController = dc;
    });

    player.start(dataChangeFlow);
  });

  it('should have the original data model upon loading the component', () => {
    const state = player.getState() as InProgressState;

    expect(state.controllers.data.get('')).toBe(dataChangeFlow.data);
  });

  it('Should get the cached data even before a transition occurs on the flow', () => {
    const state = player.getState() as InProgressState;
    dataController.set([['name.first', 'Christopher']]);

    expect(state.controllers.data.get('name.first')).toStrictEqual(
      'Christopher'
    );
  });

  it('should not update data model if transission step is not included in the commitTransition list provided on attributes', async () => {
    const state = player.getState() as InProgressState;

    dataController.set([['name.first', 'Christopher']]);

    state.controllers.flow.transition('action');

    expect(state.controllers.data.get('name.first')).toBe('Alex');
  });

  it('Should display the cached value on the view before transition', async () => {
    const state = player.getState() as InProgressState;

    dataController.set([['name.first', 'Christopher']]);

    await waitFor(() => {
      expect(
        state.controllers.view.currentView?.lastUpdate?.value
      ).toStrictEqual('Christopher');
    });
  });

  it('should have committed to data model when a listed transition reference happened', () => {
    const state = player.getState() as InProgressState;

    dataController.set([
      ['name.first', 'Christopher'],
      ['name.last', 'Alvarez'],
      ['name.middle', 'F'],
    ]);

    state.controllers.flow.transition('next');

    expect(state.controllers.data.get('')).toStrictEqual({
      name: {
        first: 'Christopher',
        last: 'Alvarez',
        middle: 'F',
      },
    });
  });

  describe('Testing without stageData flag on attribtues (Plugin not active on View)', () => {
    const dataChangeFlow2: Flow = {
      id: 'test-flow',
      data: {
        name: {
          first: 'Alex',
          last: 'Fimbres',
        },
      },
      views: [
        {
          id: 'view-1',
          type: 'view',
          value: '{{name.first}}',
        },
        {
          id: 'view-2',
          type: 'view',
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
            exp: '',
            transitions: {
              '*': 'VIEW_2',
            },
          },
          VIEW_2: {
            state_type: 'VIEW',
            ref: 'view-2',
            transitions: {
              '*': 'END_DONE',
            },
          },
          END_DONE: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    };
    let playerNoPluginActive: Player;
    let dcNoPluginActive: DataController;

    beforeAll(() => {
      playerNoPluginActive = new Player({
        plugins: [new StageReverDataPlugin()],
      });

      playerNoPluginActive.hooks.dataController.tap('test', (dc) => {
        dcNoPluginActive = dc;
      });

      playerNoPluginActive.start(dataChangeFlow2);
    });

    it('Data model should have data committed as usual', () => {
      dcNoPluginActive.set([['name.first', 'Christopher']]);

      const state = playerNoPluginActive.getState() as InProgressState;

      expect(state.controllers.data.get('name.first')).toBe('Christopher');
    });
  });
});
