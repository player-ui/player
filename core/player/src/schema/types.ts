import type { Formatting } from '@player-ui/types';

export type FormatOptions = Omit<Formatting.Reference, 'type'>;

/**
 * The return types for the schema don't include options.
 * These are already sent to the generic formatter function for that type
 */
export type FormatFunction<From, To = From, Options = unknown> = (
  val: From,
  options?: Options,
) => To | undefined;

export type FormatHandler<From, To = From> = (val: From) => To;

export interface FormatDefinition<DataModelType, UserDisplayType> {
  /**
   * A function to format data (from the data-model to the user).
   * Defaults to the identify function
   */
  format: FormatHandler<DataModelType, UserDisplayType>;

  /**
   * A function to invert the formatting (from the user to the data-model)
   * Defaults to the identify function.
   */
  deformat: FormatHandler<UserDisplayType, DataModelType>;
}

export interface FormatType<
  DataModelType,
  UserDisplayType = DataModelType,
  Options = undefined,
> {
  /**
   * The name of the formatter.
   * This corresponds to the 'type' format property when creating a DataType
   */
  name: string;

  /**
   * An optional function to format data for display to the user.
   * This goes from dataModel -> UI display
   */
  format?: FormatFunction<
    DataModelType | UserDisplayType,
    UserDisplayType,
    Options
  >;

  /**
   * An optional function for undo the action of a format function for storage.
   * This goes from UI -> dataModel
   */
  deformat?: FormatFunction<
    UserDisplayType | DataModelType,
    DataModelType,
    Options
  >;
}
