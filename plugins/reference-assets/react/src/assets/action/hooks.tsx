import React from 'react';
import { Asset } from '@player-ui/react-asset';
import { useBeacon } from '@player-ui/beacon-plugin-react';
import type { TransformedAction } from '@player-ui/reference-assets-plugin';

/** Hook to get all the props for a button */
export const useAction = (props: TransformedAction) => {
  const { label } = props;
  const beacon = useBeacon({
    asset: props,
    action: 'clicked',
    element: 'button',
  });

  return {
    id: props.id,
    onClick: () => {
      beacon();
      props.run();
    },
    children: label?.asset ? <Asset {...label?.asset} /> : null,
  } as const;
};
