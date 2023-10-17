import type { Asset, AssetWrapper, Binding, ValidationResponse } from '@player-ui/player';
import type { BeaconDataType } from '@player-ui/beacon-plugin';

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

type ChoicesEntry<AnyTextAsset extends Asset = Asset> = {
  /** Entry value to be set to binding on select */
  value: string;

  /** Description on what value is being selected */
  label: AssetWrapper<AnyTextAsset>
}

type ValueType = string | undefined;

/** A stateful instance of an action */
export interface TransformedChoice extends ChoiceAsset {
  /** A function to commit the new value to the data-model */
  set: (choiceValue: ValueType) => void;

  /** The current value of the input from the data-model */
  value: ValueType;

  /** Any validation associated with the current input's value */
  validation?: ValidationResponse;
}
