import type {
  Asset,
  AssetWrapper,
  Binding,
  ValidationResponse,
  Schema,
} from "@player-ui/player";
import type { BeaconMetaData } from "@player-ui/beacon-plugin";

/**
 * A choice asset represents a single selection choice, often displayed as radio buttons in a web context.
 * This will allow users to test out more complex flows than just inputs + buttons.
 */
export interface ChoiceAsset<AnyTextAsset extends Asset = Asset>
  extends Asset<"choice"> {
  /** A text-like asset for the choice's label */
  title?: AssetWrapper<AnyTextAsset>;

  /** Asset container for a note. */
  note?: AssetWrapper<AnyTextAsset>;

  /** The location in the data-model to store the data */
  binding?: Binding;

  /** The options to select from */
  items?: Array<ChoiceItem>;

  /** Optional additional data */
  metaData?: BeaconMetaData;
}

export type ValueType = string | number | boolean | null;

export interface ChoiceItem<AnyTextAsset extends Asset = Asset> {
  /** The id associated with the choice item */
  id: string;

  /** A text-like asset for the choice's label */
  label?: AssetWrapper<AnyTextAsset>;

  /** The value of the input from the data-model */
  value?: ValueType;
}

/** A stateful instance of a choice */
export interface TransformedChoice extends ChoiceAsset {
  /**
   * A function to unselect all of the options
   * This is typically used when selecting a placeholder value
   */
  clearSelection: () => void;

  /** The transformed options to select from */
  items?: Array<TransformedChoiceItem>;

  /** The value of the selected choice from the data-model */
  value?: ValueType;

  /** Any validation associated with the current choice's value */
  validation?: ValidationResponse;

  /** The dataType defined from the schema */
  dataType?: Schema.DataType;
}

/** A stateful instance of a Choice Item */
export interface TransformedChoiceItem extends ChoiceItem {
  /** The function that is called when a choice item is selected */
  select: () => void;

  /** The function that is called when a choice item is unSelected */
  unselect: () => void;
}
