import React from "react";
import type { View } from "@player-ui/player";
import { ReactAsset } from "./asset";

export interface ReactPlayerProps {
  /**
   * The Content view object to render
   */
  view: View;
}

/**
 * The entry for the ReactPlayer's React tree
 */
const ReactPlayer = ({ view }: ReactPlayerProps) => {
  return <ReactAsset {...view} />;
};

export default ReactPlayer;
