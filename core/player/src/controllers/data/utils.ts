import type { DataController } from ".";
import type { Logger } from "../../logger";
import type { BindingLike } from "../../binding";
import type { DataModelWithParser, DataModelOptions } from "../../data";

/** Wrapper for the Data Controller Class that prevents writes */
export class ReadOnlyDataController
  implements Pick<DataModelWithParser<DataModelOptions>, "get" | "delete">
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

  delete(binding: BindingLike, options?: DataModelOptions | undefined): void {
    this.logger?.error(
      "Error: Tried to delete in a read only instance of the DataController",
    );
  }
}
