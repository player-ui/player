import React from 'react';
import { Asset } from './asset';
import type { Asset as AssetType } from '@player-ui/player';

export interface ReactPlayerProps {
  /**
   * The Content view object to render
   */
  view: AssetType;
}

/**
 * The entry for the ReactPlayer's React tree
 */
const ReactPlayer = ({ view }: ReactPlayerProps) => {
  return <Asset {...view} />;
};

export default ReactPlayer;
