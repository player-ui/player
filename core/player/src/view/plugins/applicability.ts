import { omit } from "timm";
import type { Options } from "./options";
import type { Resolver } from "../resolver";
import type {
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
  Parser,
} from "../parser";
import { NodeType } from "../parser";
import { ViewInstance, ViewPlugin } from "../view";

/** A view plugin to remove inapplicable assets from the tree */
export default class ApplicabilityPlugin implements ViewPlugin {
  private isApplicability(obj: any) {
    return obj && Object.prototype.hasOwnProperty.call(obj, "applicability");
  }

  applyResolver(resolver: Resolver) {
    resolver.hooks.beforeResolve.tap(
      "applicability",
      (node: Node.Node | null, options: Options) => {
        let newNode = node;

        if (node?.type === NodeType.Applicability) {
          const isApplicable = options.evaluate(node.expression);

          if (isApplicable === false) {
            return null;
          }

          newNode = node.value;
        }

        return newNode;
      },
    );
  }

  applyParser(parser: Parser) {
    parser.hooks.parseNode.tap(
      "applicability",
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (this.isApplicability(obj)) {
          const parsedApplicability = parser.parseObject(
            omit(obj, "applicability"),
            nodeType,
            options,
          );

          if (!parsedApplicability) {
            return childOptions ? [] : undefined;
          }

          const applicabilityNode = parser.createASTNode(
            {
              type: NodeType.Applicability,
              expression: (obj as any).applicability,
              value: parsedApplicability,
            },
            obj,
          );

          if (!applicabilityNode) {
            return childOptions ? [] : undefined;
          }

          if (applicabilityNode.type === NodeType.Applicability) {
            applicabilityNode.value.parent = applicabilityNode;
          }

          return childOptions
            ? [
                {
                  path: [...childOptions.path, childOptions.key],
                  value: applicabilityNode,
                },
              ]
            : applicabilityNode;
        }
      },
    );
  }

  apply(view: ViewInstance) {
    view.hooks.resolver.tap("applicability", this.applyResolver.bind(this));
    view.hooks.parser.tap("applicability", this.applyParser.bind(this));
  }
}
