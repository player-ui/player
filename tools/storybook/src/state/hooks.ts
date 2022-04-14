import React from 'react';
import type { Channel } from '@storybook/channels';
import type { Flow } from '@player-ui/react';
import type { PlayerFlowMetrics } from '@player-ui/metrics-plugin-react';
import type { EventType } from './events';
import type { RenderTarget } from '../types';

export interface StateActions {
  addEvents(events: Array<EventType>): void;
  clearEvents(): void;
  setFlow(flow: Flow): void;
  setMetrics(metrics: PlayerFlowMetrics): void;
  resetFlow(): void;
  setPlatform(platform: RenderTarget['platform']): void;
}

interface BasePublishedEvent<T extends string> {
  /** The base event type */
  type: T;
}

type EventClearType = BasePublishedEvent<'@@player/event/clear'>;

interface EventAddType extends BasePublishedEvent<'@@player/event/add'> {
  /** The events to append */
  events: Array<EventType>;
}

interface FlowSetType extends BasePublishedEvent<'@@player/flow/set'> {
  /** the flow to use */
  flow: Flow;
}

type FlowResetType = BasePublishedEvent<'@@player/flow/reset'>;

interface MetricsSetEventType
  extends BasePublishedEvent<'@@player/metrics/set'> {
  /** the metrics data */
  metrics: PlayerFlowMetrics;
}

export interface PlatformSetType
  extends BasePublishedEvent<'@@player/platform/set'> {
  /** The platform to render on */
  platform: RenderTarget['platform'];
}

export type PlayerEventType =
  | EventClearType
  | EventAddType
  | FlowSetType
  | MetricsSetEventType
  | FlowResetType
  | PlatformSetType;

/** Subscribe to player events in storybook */
export function subscribe<T extends PlayerEventType>(
  chan: Channel,
  eventName: T['type'],
  callback: (evt: T) => void
): () => void {
  /** The handler to call */
  const handler = (payload: string) => {
    callback(JSON.parse(payload));
  };

  chan.addListener(eventName, handler);

  return () => {
    chan.removeListener(eventName, handler);
  };
}

/** publish an event to storybook */
export function publish(chan: Channel, event: PlayerEventType) {
  chan.emit(event.type, JSON.stringify(event));
}

/** wrapper to emit events */
export function useStateActions(chan: Channel): StateActions {
  return React.useMemo<StateActions>(
    () => ({
      addEvents: (events) => {
        publish(chan, {
          type: '@@player/event/add',
          events,
        });
      },
      setMetrics: (metrics) => {
        publish(chan, {
          type: '@@player/metrics/set',
          metrics,
        });
      },
      clearEvents: () => {
        publish(chan, {
          type: '@@player/event/clear',
        });
      },
      setFlow: (flow) => {
        publish(chan, {
          type: '@@player/flow/set',
          flow,
        });
      },
      resetFlow: () => {
        publish(chan, { type: '@@player/flow/reset' });
      },
      setPlatform: (platform) => {
        publish(chan, { type: '@@player/platform/set', platform });
      },
    }),
    [chan]
  );
}

/** react hook to subscribe to events */
export function useEventState(chan: Channel) {
  const [events, setEvents] = React.useState<Array<EventType>>([]);

  React.useEffect(() => {
    const unsubAdd = subscribe<EventAddType>(
      chan,
      '@@player/event/add',
      (evt) => setEvents((old) => [...old, ...evt.events])
    );

    const unsubClear = subscribe(chan, '@@player/event/clear', () => {
      setEvents([]);
    });

    return () => {
      unsubAdd();
      unsubClear();
    };
  }, [chan]);

  return events;
}

/** hook to subscribe to flow events */
export function useFlowState(chan: Channel) {
  const [flow, setFlow] = React.useState<Flow | undefined>();

  React.useEffect(() => {
    return subscribe<FlowSetType>(chan, '@@player/flow/set', (evt) => {
      setFlow(evt.flow);
    });
  }, [chan]);

  return flow;
}
