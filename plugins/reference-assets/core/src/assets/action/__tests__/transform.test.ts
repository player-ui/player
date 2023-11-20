import { runTransform } from '@player-ui/asset-testing-library';
import type { InProgressState } from '@player-ui/player';
import { actionTransform } from '..';

describe('action transform', () => {
  it('adds a run method that evals an expression', () => {
    const ref = runTransform('action', actionTransform, {
      type: 'action',
      exp: '{{count}} = 100',
      id: 'action',
    });

    ref.current?.run();

    expect(ref.controllers?.data.get('count')).toBe(100);
  });

  it('transitions between things', async () => {
    const ref = runTransform('action', actionTransform, {
      id: 'test-flow',
      views: [
        {
          type: 'action',
          id: 'view-1',
          value: 'Next',
        },
        {
          type: 'action',
          id: 'view-2',
          value: 'Next',
        },
      ],
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'view_1',
          view_1: {
            state_type: 'VIEW',
            ref: 'view-1',
            transitions: {
              '*': 'view_2',
            },
          },
          view_2: {
            state_type: 'VIEW',
            ref: 'view-2',
            transitions: {
              '*': 'end',
            },
          },
          end: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    });

    expect(ref.current?.id).toBe('view-1');
    ref.current?.run();
    expect(ref.current?.id).toBe('view-2');
    ref.current?.run();

    await (ref.player.getState() as InProgressState).flowResult;
    expect(ref.player.getState().status).toBe('completed');
  });

  it('prev button transitions', async () => {
    const ref = runTransform('action', actionTransform, {
      id: 'test-flow',
      views: [
        {
          type: 'action',
          id: 'view-1',
          value: 'Prev',
        },
        {
          type: 'action',
          id: 'view-2',
          value: 'Prev',
        },
      ],
      navigation: {
        BEGIN: 'FLOW_1',
        FLOW_1: {
          startState: 'view_1',
          view_1: {
            state_type: 'VIEW',
            ref: 'view-1',
            transitions: {
              '*': 'view_2',
            },
          },
          view_2: {
            state_type: 'VIEW',
            ref: 'view-2',
            transitions: {
              '*': 'end',
            },
          },
          end: {
            state_type: 'END',
            outcome: 'done',
          },
        },
      },
    });
    expect(ref?.current?.metaData?.role).toBe('back');
    expect(ref.current?.id).toBe('view-1');
    ref.current?.run();
    expect(ref.current?.id).toBe('view-2');
    ref.current?.run();

    await (ref.player.getState() as InProgressState).flowResult;
    expect(ref.player.getState().status).toBe('completed');
  });
});
