/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DataController } from ".";
import type { Logger } from "../../logger";
import type { BindingLike } from "../../binding";
import type {
  DataModelWithParser,
  DataModelOptions,
  Updates,
} from "../../data";

/** Wrapper for the Data Controller Class that prevents writes */
export class ReadOnlyDataController
  implements DataModelWithParser<DataModelOptions>
{
  private controller: DataController;
  private logger?: Logger;

  constructor(controller: DataController, logger?: Logger) {
    this.controller = controller;
    this.logger = logger;
  }

  get(binding: BindingLike, options?: DataModelOptions | undefined) {
    return this.controller.get(binding, options);
  }

  set(
    transaction: [BindingLike, any][],
    options?: DataModelOptions | undefined,
  ): Updates {
    this.logger?.error(
      "Error: Tried to set in a read only instance of the DataController",
    );
    return [];
  }

  delete(binding: BindingLike, options?: DataModelOptions | undefined): void {
    this.logger?.error(
      "Error: Tried to delete in a read only instance of the DataController",
    );
  }
}
