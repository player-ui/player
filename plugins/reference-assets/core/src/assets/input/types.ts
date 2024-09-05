import type {
  Asset,
  AssetWrapper,
  Schema,
  Binding,
  ValidationResponse,
} from "@player-ui/player";
import type { BeaconDataType } from "@player-ui/beacon-plugin";

/**
 * This is the most generic way of gathering data. The input is bound to a data model using the 'binding' property.
 * Players can get field type information from the 'schema' definition, thus to decide the input controls for visual rendering.
 * */
export interface InputAsset<AnyTextAsset extends Asset = Asset>
  extends Asset<"input"> {
  /** Asset container for a field label. */
  label?: AssetWrapper<AnyTextAsset>;

  /** Asset container for a note. */
  note?: AssetWrapper<AnyTextAsset>;

  /** The location in the data-model to store the data */
  binding: Binding;

  /** Optional additional data */
  metaData?: {
    /** Additional data to beacon when this input changes */
    beacon?: BeaconDataType;
  };
}

type ValueType = string | undefined;

export interface TransformedInput extends InputAsset {
  /** A function to commit the new value to the data-model */
  set: (newValue: ValueType) => void;

  /** A function to format a value */
  format: (newValue: ValueType) => ValueType;

  /** The current value of the input from the data-model */
  value: ValueType;

  /** Any validation associated with the current input's value */
  validation?: ValidationResponse;

  /** The dataType defined from the schema */
  dataType?: Schema.DataType;
}
