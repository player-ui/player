import React from 'react';
import { useDispatch } from 'react-redux';
import type { Channel } from '@storybook/channels';
import { setJSONEditorValue } from '../redux';

/** A flow to listen for the global `@@player/flow/set` cmd and update the flow accordingly */
export const useFlowSetListener = (chan: Channel) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    /** Constant handler for subscribe/unsub */
    const handler = (payload: string) => {
      try {
        const { flow } = JSON.parse(payload);
        dispatch(setJSONEditorValue({ value: flow }));
      } catch (e) {
        console.error('Unable to set JSON payload from storybook event', e);
      }
    };

    const eventName = '@@player/flow/set';

    chan.addListener(eventName, handler);

    return () => {
      chan.removeListener(eventName, handler);
    };
  }, [chan]);
};
