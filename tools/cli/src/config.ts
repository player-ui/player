import type { PlayerCLIPlugin } from './plugins';

export interface PlayerConfigFileShape {
  /** A base config to inherit defaults from */
  extends?: string | PlayerConfigFileShape;

  /** A list of plugins to apply */
  plugins?: Array<string | [string, any] | PlayerCLIPlugin>;

  /** A list of presets to apply */
  presets?: Array<PlayerConfigFileShape | string>;
}

export interface PlayerConfigResolvedShape {
  /** Options related to the DSL and compilation */
  dsl?: {
    /** An input directory for compilation */
    src?: string;

    /** An output directory to use */
    outDir?: string;

    /** Flag to omit validating the resulting JSON */
    skipValidation?: boolean;
  };

  /** Options related to JSON and validation */
  json?: {
    /** An input file, directory, glob, or list of any of the above to use as inputs for validation */
    src?: string | string[];
  };

  /** Flattened list of plugins */
  plugins: Array<PlayerCLIPlugin>;
}
