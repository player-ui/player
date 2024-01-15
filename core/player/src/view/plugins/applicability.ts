import { omit } from "timm";
import type { ViewPlugin } from "./plugin";
import type { Options } from "./options";
import type { Resolver } from "../resolver";
import type { Node, ParseObjectOptions, Parser } from "../parser";
import { NodeType } from "../parser";
import { ViewInstance } from "../view";

/** A view plugin to remove inapplicable assets from the tree */
export default class ApplicabilityPlugin implements ViewPlugin {
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
    /** Switches resolved during the parsing phase are static */
    parser.hooks.determineNodeType.tap("applicability", (obj: any) => {
      if (Object.prototype.hasOwnProperty.call(obj, "applicability")) {
        return NodeType.Applicability;
      }
    });

    parser.hooks.parseNode.tap(
      "applicability",
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        determinedNodeType: null | NodeType,
      ) => {
        if (determinedNodeType === NodeType.Applicability) {
          const parsedApplicability = parser.parseObject(
            omit(obj, "applicability"),
            nodeType,
            options,
          );
          if (parsedApplicability !== null) {
            const applicabilityNode = parser.createASTNode(
              {
                type: NodeType.Applicability,
                expression: (obj as any).applicability,
                value: parsedApplicability,
              },
              obj,
            );

            if (applicabilityNode?.type === NodeType.Applicability) {
              applicabilityNode.value.parent = applicabilityNode;
            }

            return applicabilityNode;
          }
        }
      },
    );
  }

  apply(view: ViewInstance) {
    view.hooks.resolver.tap("applicability", this.applyResolver.bind(this));
    view.hooks.parser.tap("applicability", this.applyParser.bind(this));
  }
}
