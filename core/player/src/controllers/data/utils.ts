import type { DataController } from ".";
import type { BindingLike } from "../../binding";
import type { DataModelWithParser, DataModelOptions } from "../../data";

/** Wrapper for the Data Controller Class that prevents writes */
export class ReadOnlyDataController
  implements Pick<DataModelWithParser<DataModelOptions>, "get">
{
  private controller: DataController;

  constructor(controller: DataController) {
    this.controller = controller;
  }

  get(binding: BindingLike, options?: DataModelOptions | undefined) {
    return this.controller.get(binding, options);
  }
}
