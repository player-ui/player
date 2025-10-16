import { ViewInstance, ViewPlugin } from "../view";
import type {
  Parser,
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
} from "../parser";
import { NodeType } from "../parser";

/** A view plugin to resolve assets */
export class AssetPlugin implements ViewPlugin {
  applyParser(parser: Parser) {
    parser.hooks.parseNode.tap(
      "asset",
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (childOptions?.key === "asset" && typeof obj === "object") {
          const assetAST = parser.parseObject(obj, NodeType.Asset, options);

          if (!assetAST) {
            return [];
          }

          return [
            {
              path: [...childOptions.path, childOptions.key],
              value: assetAST,
            },
          ];
        }
      },
    );
  }

  apply(view: ViewInstance) {
    view.hooks.parser.tap("asset", this.applyParser.bind(this));
  }
}
