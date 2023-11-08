import type { Flow } from '@player-ui/types';
import React, { useCallback, useEffect, useState } from 'react';
import { useReactPlayer } from '../hooks';
import type { PlayerSubscriberProps, SupportedEvents } from './types';

/**
 * Player Subscriber
 *
 * This component wraps the ReactPlayer and subscribes to events.
 */
export const PlayerSubscriber = ({
  playerConfig,
  initialFlow,
  subscribe,
}: PlayerSubscriberProps) => {
  const [state, setState] = useState<Flow>(initialFlow);
  const { reactPlayer } = useReactPlayer(playerConfig);

  const setData = useCallback(
    (data: Flow['data']) => {
      const playerState = reactPlayer.player.getState();
      if (data && playerState.status === 'in-progress') {
        playerState.controllers.data.set(data);
      }
    },
    [reactPlayer.player]
  );

  const eventHandler = useCallback(
    (event: SupportedEvents) => {
      switch (event.type) {
        case 'FLOW_CHANGE':
          setState((currState) => ({ ...currState, ...event.payload }));
          break;
        case 'DATA_CHANGE':
          setData(event.payload);
          break;
        default:
          break;
      }
    },
    [setData]
  );

  useEffect(() => {
    return subscribe(eventHandler);
  }, [eventHandler, subscribe]);

  useEffect(() => {
    reactPlayer.start(state);
  }, [reactPlayer, state]);

  return <reactPlayer.Component />;
};
