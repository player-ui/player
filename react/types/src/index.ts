import type { Asset } from '@player-ui/player';

export interface SensitiveMetaData {
  /** Asset value becomes masked when in a session sharing private data. */
  sensitive?: boolean;

  /**
   * For Text Assets that need to show a portion of data along with a toggle
   * button. Used when in a session sharing private data.
   */
  unmaskable?: boolean;
}

export interface AssetWithSensitiveMetaData<T extends string = string>
  extends Asset<T> {
  /**
   * Optional metaData that marks an Asset as sensitive when in a session
   * sharing private data.
   */
  metaData?: SensitiveMetaData;
}

export type BeaconDataType = string | Record<string, any>;

export interface BeaconMetaData {
  /** Additional data to send along with beacons */
  beacon?: BeaconDataType;
}
