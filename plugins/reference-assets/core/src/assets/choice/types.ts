import type { Asset, AssetWrapper, Binding, ValidationResponse } from '@player-ui/player';
import type { BeaconDataType } from '@player-ui/beacon-plugin';
import type { ChoicesEntry, TransformedChoicesEntry } from './choices-entry'

/**
 * A choice asset represents a single selection choice, often displayed as radio buttons in a web context. 
 * This will allow users to test out more complex flows than just inputs + buttons.
 */
export interface ChoiceAsset<AnyTextAsset extends Asset = Asset>
  extends Asset<'choice'> {
  /** Context on what choice the user is making */
  title: AssetWrapper<AnyTextAsset>;

  /** More detailed information about the selection */
  note?: AssetWrapper<AnyTextAsset>;

  /** The location in the data-model to store the data */
  binding: Binding;

  /** An array of choices */
  choices: Array<ChoicesEntry>

  /** Optional additional data */
  metaData?: {
    /** Additional data to beacon when this input changes */
    beacon?: BeaconDataType;
  };
}

type ValueType = string | undefined;

/** A stateful instance of an action */
export interface TransformedChoice extends ChoiceAsset {
  /** Any validation associated with the current input's value */
  validation?: ValidationResponse;
}
