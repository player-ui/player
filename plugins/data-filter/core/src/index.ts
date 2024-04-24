import type { Player, PlayerPlugin } from "@player-ui/player";
import get from "dlv";
import { omit, setIn } from "timm";

export interface DataFilterPluginOptions {
  /** Paths in the model that should be omitted from the serialized result */
  paths?: Array<string | Array<string>>;
}

/**
 * Similar to timm's omit, but for deeper paths
 */
export function omitIn(
  obj: Record<string, unknown>,
  path: string | Array<string>,
): unknown {
  if (typeof path === "string") {
    return omit(obj, path);
  }

  if (path.length === 1) {
    return omit(obj, path[0]);
  }

  const parentPath = [...path];
  const attr = parentPath.pop();

  if (!attr) {
    return obj;
  }

  const parentObj = get(obj, parentPath);

  return setIn(obj, parentPath, omit(parentObj, attr));
}

/**
 * A plugin to manage constant strings across flows
 * It allows for runtime extensions/overrides through a `constants` property in the flow
 */
export class DataFilterPlugin implements PlayerPlugin {
  name = "data-filter";

  private readonly options: DataFilterPluginOptions;

  constructor(options: DataFilterPluginOptions = {}) {
    this.options = options;
  }

  apply(player: Player) {
    player.hooks.dataController.tap(this.name, (dataController) => {
      dataController.hooks.serialize.tap(this.name, (serializedModel) => {
        let updatedModel = serializedModel;

        this.options.paths?.forEach((path) => {
          const arrPath = Array.isArray(path) ? path : path.split(".");
          updatedModel = omitIn(updatedModel, arrPath);
        });

        return updatedModel;
      });
    });
  }
}
