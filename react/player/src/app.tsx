import React from 'react';
import { Asset } from '@player-ui/react-asset';
import type { Asset as AssetType } from '@player-ui/player';

export interface WebPlayerProps {
  /**
   * The Content view object to render
   */
  view: AssetType;
}

/**
 * The entry for the WebPlayer's React tree
 */
const WebPlayer = ({ view }: WebPlayerProps) => {
  return (
    <div>
      <Asset {...view} />
    </div>
  );
};

export default WebPlayer;
