import type { Flow } from '@player-ui/player';
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
