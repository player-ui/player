import { ViewInstance, ViewPlugin } from "../view";
import type {
  Parser,
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
} from "../parser";
import { NodeType } from "../parser";
import { hasTemplateValues, hasTemplateKey } from "../parser/utils";

/** A view plugin to resolve multi nodes */
export default class MultiNodePlugin implements ViewPlugin {
  applyParser(parser: Parser) {
    parser.hooks.parseNode.tap(
      "multi-node",
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (
          childOptions &&
          !hasTemplateKey(childOptions.key) &&
          Array.isArray(obj)
        ) {
          const values = obj
            .map((childVal) =>
              parser.parseObject(childVal, NodeType.Value, options),
            )
            .filter((child): child is Node.Node => !!child);

          if (!values.length) {
            return [];
          }

          const multiNode = parser.createASTNode(
            {
              type: NodeType.MultiNode,
              override: !hasTemplateValues(
                childOptions.parentObj,
                childOptions.key,
              ),
              values,
            },
            obj,
          );

          if (!multiNode) {
            return [];
          }

          if (multiNode.type === NodeType.MultiNode) {
            multiNode.values.forEach((v) => {
              v.parent = multiNode;
            });
          }

          return [
            {
              path: [...childOptions.path, childOptions.key],
              value: multiNode,
            },
          ];
        }
      },
    );
  }

  apply(view: ViewInstance) {
    view.hooks.parser.tap("multi-node", this.applyParser.bind(this));
  }
}
