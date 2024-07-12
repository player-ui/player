import React from "react";
import type { CheckPathPlugin } from "@player-ui/check-path-plugin";

export interface CheckPathContextType {
  /** The core plugin to talk to */
  plugin?: CheckPathPlugin;
}

export const CheckPathContext = React.createContext<CheckPathContextType>({
  plugin: undefined,
});
