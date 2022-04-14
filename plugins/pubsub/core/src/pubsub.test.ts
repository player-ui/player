import { Player } from '@player-ui/player';
import { PubSubPlugin } from './pubsub';
import { PubSubPluginSymbol } from './symbols';

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
      onStart: 'customPublish("pet.names", ["ginger", "daisy"])',
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

test('handles subscriptions', () => {
  const pubsubPlugin = new PubSubPlugin();

  const handler1 = jest.fn();
  pubsubPlugin.subscribe('foo', handler1);

  const handler2 = jest.fn();
  const token2 = pubsubPlugin.subscribe('foo.bar', handler2);

  pubsubPlugin.publish('foo.bar', 'baz');
  expect(handler1).toBeCalledTimes(1);
  expect(handler2).toBeCalledTimes(1);
  expect(handler1).toBeCalledWith('foo.bar', 'baz');
  expect(handler2).toBeCalledWith('foo.bar', 'baz');

  pubsubPlugin.publish('foo', 'baz times 2');
  expect(handler1).toBeCalledTimes(2);
  expect(handler2).toBeCalledTimes(1);

  pubsubPlugin.unsubscribe(token2);

  pubsubPlugin.publish('foo.bar', 'go again!');
  expect(handler1).toBeCalledTimes(3);
  expect(handler2).toBeCalledTimes(1);
  expect(handler1).toBeCalledWith('foo.bar', 'go again!');
});

test('loads an expression', () => {
  const pubsub = new PubSubPlugin();

  const player = new Player({
    plugins: [pubsub],
  });

  const topLevel = jest.fn();
  const nested = jest.fn();
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

  const topLevel = jest.fn();
  const nested = jest.fn();
  pubsub.subscribe('pet', topLevel);
  pubsub.subscribe('pet.names', nested);

  player.start(customName as any);

  expect(topLevel).toBeCalledTimes(1);
  expect(topLevel).toBeCalledWith('pet.names', ['ginger', 'daisy']);

  expect(nested).toBeCalledTimes(1);
  expect(nested).toBeCalledWith('pet.names', ['ginger', 'daisy']);
});

test('finds plugin', () => {
  const pubsub = new PubSubPlugin();

  const player = new Player({ plugins: [pubsub] });

  expect(player.findPlugin<PubSubPlugin>(PubSubPluginSymbol)).toBe(pubsub);
});
