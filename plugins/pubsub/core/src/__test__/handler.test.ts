import type { InProgressState } from '@player-ui/player';
import { Player } from '@player-ui/player';
import { PubSubPlugin } from '../plugin';
import type { PubSubHandler } from '../handler';
import { PubSubHandlerPlugin } from '../handler';
import { pubsub as pubsubimpl } from '../pubsub';

const customEventFlow = {
  id: 'customEventFlow',
  views: [
    {
      id: 'view-1',
      type: 'info',
    },
  ],
  navigation: {
    BEGIN: 'FLOW_1',
    FLOW_1: {
      onStart: 'publish("customEvent", {{foo.bar}}, "daisy")',
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
  data: {
    foo: {
      bar: 'ginger',
      baz: '',
    },
  },
};

describe('PubSubHandlerPlugin', () => {
  beforeEach(() => {
    pubsubimpl.clear();
  });

  it('registers a new subscription handler', () => {
    const pubsub = new PubSubPlugin();
    const spy = jest.fn();

    const player = new Player({
      plugins: [
        pubsub,
        new PubSubHandlerPlugin(new Map([['customEvent', spy]])),
      ],
    });

    player.start(customEventFlow as any);

    expect(spy).toHaveBeenCalledWith(expect.anything(), 'ginger', 'daisy');
    expect(pubsubimpl.count('customEvent')).toBe(1);
  });

  it('sets data in subscription', () => {
    const pubsub = new PubSubPlugin();

    /**
     *
     */
    const customEventHandler: PubSubHandler<string[]> = (
      context,
      pet1,
      pet2
    ) => {
      context.controllers.data.set([['foo.baz', pet2]]);
    };

    const subscriptions = new Map([['customEvent', customEventHandler]]);

    const player = new Player({
      plugins: [pubsub, new PubSubHandlerPlugin(subscriptions)],
    });

    player.start(customEventFlow as any);

    expect(pubsubimpl.count('customEvent')).toBe(1);

    const state = player.getState() as InProgressState;
    expect(state.controllers.data.get('foo.baz')).toBe('daisy');
  });
});
