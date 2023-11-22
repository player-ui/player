import { Player } from '@player-ui/player';
import { PubSubPlugin } from '../plugin';
import { PubSubPluginSymbol } from '../symbols';

const minimal = {
  id: 'minimal',
  views: [
    {
      id: 'view-1',
      type: 'info',
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      onStart: 'publish("pet.names", ["ginger", "daisy"])',
      startState: 'VIEW_1',
      VIEW_1: {
        ref: 'view-1',
        state_type: 'VIEW',
        transitions: {
          Next: 'VIEW_2',
          '*': 'END_Done',
        },
      },
    },
  },
};

const multistart = {
  id: 'minimal',
  views: [
    {
      id: 'view-1',
      type: 'info',
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      onStart: [
        'publish("pet", ["ginger", "daisy"])',
        'customPublish("pet", ["ginger", "daisy"])',
      ],
      startState: 'VIEW_1',
      VIEW_1: {
        ref: 'view-1',
        state_type: 'VIEW',
        transitions: {
          Next: 'VIEW_2',
          '*': 'END_Done',
        },
      },
    },
  },
};

const customName = {
  id: 'custom',
  views: [
    {
      id: 'view-1',
      type: 'info',
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      onStart: 'customPublish("pet.names", "ginger", "daisy")',
      startState: 'VIEW_1',
      VIEW_1: {
        ref: 'view-1',
        state_type: 'VIEW',
        transitions: {
          Next: 'VIEW_2',
          '*': 'END_Done',
        },
      },
    },
  },
};

test('loads an expression', () => {
  const pubsub = new PubSubPlugin();

  const player = new Player({
    plugins: [pubsub],
  });

  const topLevel = vitest.fn();
  const nested = vitest.fn();
  pubsub.subscribe('pet', topLevel);
  pubsub.subscribe('pet.names', nested);

  player.start(minimal as any);

  expect(topLevel).toBeCalledTimes(1);
  expect(topLevel).toBeCalledWith('pet.names', ['ginger', 'daisy']);

  expect(nested).toBeCalledTimes(1);
  expect(nested).toBeCalledWith('pet.names', ['ginger', 'daisy']);
});

test('handles custom expression names', () => {
  const pubsub = new PubSubPlugin({ expressionName: 'customPublish' });

  const player = new Player({
    plugins: [pubsub],
  });

  const topLevel = vitest.fn();
  const nested = vitest.fn();
  pubsub.subscribe('pet', topLevel);
  pubsub.subscribe('pet.names', nested);

  player.start(customName as any);

  expect(topLevel).toBeCalledTimes(1);
  expect(topLevel).toBeCalledWith('pet.names', 'ginger', 'daisy');

  expect(nested).toBeCalledTimes(1);
  expect(nested).toBeCalledWith('pet.names', 'ginger', 'daisy');
});

test('finds plugin', () => {
  const pubsub = new PubSubPlugin();

  const player = new Player({ plugins: [pubsub] });

  expect(player.findPlugin<PubSubPlugin>(PubSubPluginSymbol)).toBe(pubsub);
});

test('only calls subscription once if multiple pubsub plugins are registered', () => {
  const pubsub = new PubSubPlugin();
  const pubsub2 = new PubSubPlugin();

  const player = new Player({ plugins: [pubsub, pubsub2] });

  const topLevel = vitest.fn();
  pubsub.subscribe('pet', topLevel);

  player.start(minimal as any);

  expect(topLevel).toBeCalledTimes(1);
  expect(topLevel).toBeCalledWith('pet.names', ['ginger', 'daisy']);
});

test('calls subscription for each pubsub registered through pubsubplugin', () => {
  const pubsub = new PubSubPlugin();
  const pubsub2 = new PubSubPlugin({ expressionName: 'customPublish' });

  const player = new Player({ plugins: [pubsub, pubsub2] });

  const spy = vitest.fn();
  pubsub.subscribe('pet', spy);

  player.start(multistart as any);

  expect(spy).toBeCalledTimes(2);
  expect(spy).toHaveBeenNthCalledWith(1, 'pet', ['ginger', 'daisy']);
  expect(spy).toHaveBeenNthCalledWith(2, 'pet', ['ginger', 'daisy']);
});
