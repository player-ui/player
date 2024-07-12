import type { ReactPlayerPlugin } from "@player-ui/react";
import type { AppetizeVersions } from "./player/Appetize";

export interface PlayerParametersType {
  /** Options for the dsl editor */
  dslEditor?: {
    /** Enable more imports */
    additionalModules?: Record<string, any>;
  };

  /** plugins to use for any loaded player */
  reactPlayerPlugins?: Array<ReactPlayerPlugin>;

  /** Appetize tokens to use */
  appetizeTokens?: {
    /** the ios token */
    ios?: string;

    /** the android token */
    android?: string;
  };

  /** The base URL to use for appetize if it is not the default */
  appetizeBaseUrl?: string;

  /** The OS Versions to use for appetize */
  appetizeVersions?: AppetizeVersions;
}

export type AsyncImportFactory<T> = () => Promise<{
  /** default export of the module */
  default: T;
}>;

export type RenderTarget = {
  /** platform to render on */
  platform: "ios" | "android" | "web";

  /** the token to use if applicable */
  token?: string;

  /** A different base URL for appetize if necessary */
  baseUrl?: string;

  /** The OS Versions to use for appetize */
  appetizeVersions?: AppetizeVersions;
};
