import { ViewInstance, ViewPlugin } from "../view";
import type { Options } from "./options";
import type {
  Parser,
  Node,
  ParseObjectOptions,
  ParseObjectChildOptions,
} from "../parser";
import { EMPTY_NODE, NodeType } from "../parser";
import type { Resolver } from "../resolver";
import { hasSwitchKey } from "../parser/utils";

/** A view plugin to resolve switches */
export class SwitchPlugin implements ViewPlugin {
  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  private resolveSwitch(node: Node.Switch, options: Options): Node.Node {
    for (const switchCase of node.cases) {
      const isApplicable = options.evaluate(switchCase.case);
      if (isApplicable) {
        return switchCase.value;
      }
    }

    return EMPTY_NODE;
  }

  private isSwitch(obj: any) {
    return (
      obj &&
      (Object.prototype.hasOwnProperty.call(obj, "dynamicSwitch") ||
        Object.prototype.hasOwnProperty.call(obj, "staticSwitch"))
    );
  }

  applyParser(parser: Parser) {
    /** Switches resolved during the parsing phase are static */
    parser.hooks.onCreateASTNode.tap("switch", (node) => {
      if (node && node.type === NodeType.Switch && !node.dynamic) {
        return this.resolveSwitch(node, this.options);
      }

      return node;
    });

    parser.hooks.parseNode.tap(
      "switch",
      (
        obj: any,
        _nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        childOptions?: ParseObjectChildOptions,
      ) => {
        if (
          this.isSwitch(obj) ||
          (childOptions && hasSwitchKey(childOptions.key))
        ) {
          const objToParse =
            childOptions && hasSwitchKey(childOptions.key)
              ? { [childOptions.key]: obj }
              : obj;
          const dynamic = "dynamicSwitch" in objToParse;
          const switchContent = dynamic
            ? objToParse.dynamicSwitch
            : objToParse.staticSwitch;

          const cases: Node.SwitchCase[] = switchContent
            .map(
              (switchCase: {
                [x: string]: any;
                /**
                 *
                 */
                case: any;
              }) => {
                const { case: switchCaseExpr, ...switchBody } = switchCase;
                const value = parser.parseObject(
                  switchBody,
                  NodeType.Value,
                  options,
                );

                if (value) {
                  return {
                    case: switchCaseExpr,
                    value: value as Node.Value,
                  };
                }

                return;
              },
            )
            .filter(Boolean);

          const switchAST = parser.createASTNode(
            {
              type: NodeType.Switch,
              dynamic,
              cases,
            },
            objToParse,
          );

          if (!switchAST || switchAST.type === NodeType.Empty) {
            return childOptions ? [] : null;
          }

          if (switchAST.type === NodeType.Switch) {
            switchAST.cases.forEach((sCase) => {
              sCase.value.parent = switchAST;
            });
          }

          if (childOptions) {
            let path = [...childOptions.path, childOptions.key];
            let value: any = switchAST;

            if (
              switchAST.type === NodeType.Value &&
              switchAST.children?.length === 1 &&
              switchAST.value === undefined
            ) {
              const firstChild = switchAST.children[0];
              path = [...path, ...firstChild.path];
              value = firstChild.value;
            }

            return [{ path, value }];
          }

          return switchAST;
        }
      },
    );
  }

  applyResolver(resolver: Resolver) {
    /** Switches resolved during the parsing phase are dynamic */
    resolver.hooks.beforeResolve.tap("switch", (node, options) => {
      if (node && node.type === NodeType.Switch && node.dynamic) {
        return this.resolveSwitch(node, options);
      }

      return node;
    });
  }

  apply(view: ViewInstance) {
    view.hooks.parser.tap("switch", this.applyParser.bind(this));
    view.hooks.resolver.tap("switch", this.applyResolver.bind(this));
  }
}
