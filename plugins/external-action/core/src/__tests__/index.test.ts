import type { Flow, InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { ExternalActionPlugin } from '..';

const externalFlow = {
  id: 'test-flow',
  data: {
    transitionValue: 'Next',
  },
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      startState: 'EXT_1',
      EXT_1: {
        state_type: 'EXTERNAL',
        ref: 'test-1',
        transitions: {
          Next: 'END_FWD',
          Prev: 'END_BCK',
        },
      },
      END_FWD: {
        state_type: 'END',
        outcome: 'FWD',
      },
      END_BCK: {
        state_type: 'END',
        outcome: 'BCK',
      },
    },
  },
};

test('handles the external state', async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        return options.data.get('transitionValue');
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe('FWD');
});

test('thrown errors will fail player', async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        throw new Error('Bad Code');
      }),
    ],
  });

  await expect(player.start(externalFlow as Flow)).rejects.toThrow();

  expect(player.getState().status).toBe('error');
});

test('works async', async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin(() => {
        return Promise.resolve('Prev');
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe('BCK');
});

test('allows multiple plugins', async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Next');
          }, 100);
        });
      }),
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('Prev');
          }, 50);
        });
      }),
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(undefined);
          }, 10);
        });
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  // Prev should win
  expect(completed.endState.outcome).toBe('BCK');
});

test('only transitions if player still on this external state', async () => {
  let resolver: (() => void) | undefined;
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        return new Promise((res) => {
          // Only save resolver for first external action
          if (!resolver) {
            resolver = () => {
              res(options.data.get('transitionValue'));
            };
          }
        });
      }),
    ],
  });

  player.start({
    id: 'test-flow',
    data: {
      transitionValue: 'Next',
    },
    navigation: {
      BEGIN: 'FLOW_1',
      FLOW_1: {
        startState: 'EXT_1',
        EXT_1: {
          state_type: 'EXTERNAL',
          ref: 'test-1',
          transitions: {
            Next: 'EXT_2',
            Prev: 'END_BCK',
          },
        },
        EXT_2: {
          state_type: 'EXTERNAL',
          ref: 'test-2',
          transitions: {
            Next: 'END_FWD',
            Prev: 'END_BCK',
          },
        },
        END_FWD: {
          state_type: 'END',
          outcome: 'FWD',
        },
        END_BCK: {
          state_type: 'END',
          outcome: 'BCK',
        },
      },
    },
  } as Flow);

  let state = player.getState();
  expect(state.status).toBe('in-progress');
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name
  ).toBe('EXT_1');

  // probably dumb way to wait for async stuff to resolve
  await new Promise<void>((res) => {
    /**
     *
     */
    function waitForResolver() {
      if (resolver) res();
      else setTimeout(waitForResolver, 50);
    }

    waitForResolver();
  });

  (state as InProgressState).controllers.flow.transition('Next');

  state = player.getState();
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name
  ).toBe('EXT_2');

  // Attempt to resolve _after_ Player has transitioned
  resolver?.();

  // Should be same as prev
  state = player.getState();
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name
  ).toBe('EXT_2');
});
