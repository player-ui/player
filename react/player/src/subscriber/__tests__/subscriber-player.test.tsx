import { makeFlow } from '@player-ui/make-flow';
import type { Flow } from '@player-ui/types';
import { act, configure, getNodeText, render } from '@testing-library/react';
import React from 'react';
import { SimpleAssetPlugin } from '../../__tests__/helpers/simple-asset-plugin';
import { PlayerSubscriber } from '../subscriber-player';
import type { PlayerPublisher, SupportedEvents } from '../types';

configure({ testIdAttribute: 'id' });

const mockInitialFlow = makeFlow({
  id: 'loading-page',
  type: 'simple',
  value: 'Loading...',
});

/**
 * Mock Publisher
 */
class MockPublisher implements PlayerPublisher {
  subscribers: Set<(event: SupportedEvents) => void> = new Set();

  subscribe = (callback: (event: SupportedEvents) => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  publish = (event: SupportedEvents) => {
    this.subscribers.forEach((callback) => callback(event));
  };
}

const mockPlayerConfig = { plugins: [new SimpleAssetPlugin()] };

describe('PlayerSubscriber', () => {
  test('renders the initial flow', async () => {
    const Publisher = new MockPublisher();
    const component = render(
      <PlayerSubscriber
        {...{
          initialFlow: mockInitialFlow,
          subscribe: Publisher.subscribe,
          playerConfig: mockPlayerConfig,
        }}
      />
    );

    const viewNode = await component.findByTestId('loading-page');
    expect(getNodeText(viewNode)).toBe('Loading...');
  });

  test('renders the flow from the FLOW_CHANGE event', async () => {
    const Publisher = new MockPublisher();
    const component = render(
      <PlayerSubscriber
        {...{
          initialFlow: mockInitialFlow,
          subscribe: Publisher.subscribe,
          playerConfig: mockPlayerConfig,
        }}
      />
    );

    act(() => {
      Publisher.publish({
        type: 'FLOW_CHANGE',
        payload: makeFlow({
          id: 'new-flow',
          type: 'simple',
          value: 'New Flow',
        }),
      });
    });

    const viewNode = await component.findByTestId('new-flow');
    expect(getNodeText(viewNode)).toBe('New Flow');
  });

  test('updates the data on DATA_CHANGE event', async () => {
    const Publisher = new MockPublisher();
    const initialFlow = {
      id: 'flow_1',
      views: [
        {
          id: 'first_view',
          type: 'simple',
          value: '{{foo.bar}}',
        },
      ],
      data: {
        foo: {
          bar: 'Initial Value',
        },
      },
      navigation: {
        BEGIN: 'flow_1',
        flow_1: {
          startState: 'view_1',
          view_1: {
            state_type: 'VIEW',
            ref: 'first_view',
            transitions: {
              '*': 'end_1',
            },
          },
          end_1: {
            state_type: 'END',
            outcome: 'end',
          },
        },
      },
    } as Flow;

    const component = render(
      <PlayerSubscriber
        {...{
          initialFlow,
          subscribe: Publisher.subscribe,
          playerConfig: mockPlayerConfig,
        }}
      />
    );

    act(() => {
      Publisher.publish({
        type: 'DATA_CHANGE',
        payload: {
          foo: {
            bar: 'New Value',
          },
        },
      });
    });

    const viewNode = await component.findByTestId('first_view');
    expect(getNodeText(viewNode)).toBe('New Value');
  });
});
