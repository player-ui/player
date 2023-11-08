import type { Flow } from '@player-ui/types';
import type { ReactPlayerOptions } from '../player';

export type SupportedEvents =
  | {
      /** Event type. */
      type: 'FLOW_CHANGE';
      /** Flow change event payload. */
      payload: Partial<Flow>;
    }
  | {
      /** Event type. */
      type: 'DATA_CHANGE';
      /** Data change event payload. */
      payload: Flow['data'];
    };

export interface PlayerSubscriberProps {
  /** ReactPlayer config. */
  playerConfig: ReactPlayerOptions;
  /** Initial Flow. */
  initialFlow: Flow;
  /** Subscribe to events. */
  subscribe: (callback: (event: SupportedEvents) => void) => () => void;
}

export interface PlayerPublisher {
  /** Set of subscribers. */
  subscribers: Set<(event: SupportedEvents) => void>;
  /** Subscribe to events and returns a function to unsubscribe. */
  subscribe: (callback: (event: SupportedEvents) => void) => () => void;
  /** Publish an event to all subscribers. */
  publish: (event: SupportedEvents) => void;
}
