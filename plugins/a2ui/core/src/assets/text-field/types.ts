import type {
  Asset,
  Binding,
  Schema,
  ValidationResponse,
} from "@player-ui/player";
import type { A2UICommon } from "../common";

export type TextFieldType =
  | "shortText"
  | "longText"
  | "number"
  | "obscured"
  | "date";

/** Text input field with optional validation. */
export interface TextFieldAsset extends Asset<"TextField">, A2UICommon {
  label?: string;
  /** Data binding that holds the current value. */
  value?: Binding;
  textFieldType?: TextFieldType;
  /** Regex applied client-side to validate the entered value. */
  validationRegexp?: string;
}

/** TextField after the transform: provides current value plus setters. */
export interface TransformedTextField extends TextFieldAsset {
  /** Current value pulled from the data model. */
  currentValue: string | undefined;
  /** Commits a new value to the data model. */
  set: (newValue: string | undefined) => void;
  /** Format a value through any schema-attached formatters. */
  format: (newValue: string | undefined) => string | undefined;
  /** Validation result for the bound model location. */
  validation?: ValidationResponse;
  /** dataType discovered from the schema, if any. */
  dataType?: Schema.DataType;
}
