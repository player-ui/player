import type { Asset, AssetWrapper } from '@player-ui/player';

/**
 * A choices entry in the choices array.
 */
export type ChoicesEntry = {
  /** Entry value to be set to binding on select */
  value: string;

  /** Description on what value is being selected */
  label: AssetWrapper<Asset>
}

/** A stateful instance of an action */
export interface TransformedChoicesEntry extends ChoicesEntry {
  /** A function to commit the new value to the data-model */
  set: (selected: boolean) => void;

  /** Set to true when current choice is selected */
  selected: boolean;
}
