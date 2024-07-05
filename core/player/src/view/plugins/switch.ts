import type { View, ViewPlugin } from './plugin';
import type { Options } from './options';
import type { Parser, Node, ParseObjectOptions } from '../parser';
import { hasSwitchKey } from '../parser/utils';
import { EMPTY_NODE, NodeType } from '../parser';
import type { Resolver } from '../resolver';

/** A view plugin to resolve switches */
export default class SwitchPlugin implements ViewPlugin {
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

  applyParser(parser: Parser) {
    /** Switches resolved during the parsing phase are static */
    parser.hooks.onCreateASTNode.tap('switch', (node) => {
      if (node && node.type === NodeType.Switch && !node.dynamic) {
        return this.resolveSwitch(node, this.options);
      }

      return node;
    });

    parser.hooks.determineNodeType.tap('switch', (obj) => {
      if (
        obj &&
        (Object.prototype.hasOwnProperty.call(obj, 'dynamicSwitch') ||
          Object.prototype.hasOwnProperty.call(obj, 'staticSwitch'))
      ) {
        return NodeType.Switch;
      }
    });

    parser.hooks.parseNode.tap(
      'switch',
      (
        obj: any,
        nodeType: Node.ChildrenTypes,
        options: ParseObjectOptions,
        determinedNodeType: null | NodeType
      ) => {
        if (determinedNodeType === NodeType.Switch) {
          const dynamic = 'dynamicSwitch' in obj;
          const switchContent = dynamic ? obj.dynamicSwitch : obj.staticSwitch;

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
                  options
                );

                if (value) {
                  return {
                    case: switchCaseExpr,
                    value: value as Node.Value,
                  };
                }

                // eslint-disable-next-line no-useless-return
                return;
              }
            )
            .filter(Boolean);

          const switchAST = parser.hooks.onCreateASTNode.call(
            {
              type: NodeType.Switch,
              dynamic,
              cases,
            },
            obj
          );

          if (!switchAST || switchAST.type === NodeType.Empty) {
            return null;
          }

          if (switchAST.type === NodeType.Switch) {
            switchAST.cases.forEach((sCase) => {
              // eslint-disable-next-line no-param-reassign
              sCase.value.parent = switchAST;
            });
          }

          return switchAST;
        }
      }
    );

    parser.hooks.parseAndCreateChildNode.tap(
      'switch',
      (
        options: ParseObjectOptions,
        localKey: string,
        localValue: any,
        path: Node.PathSegment[]
      ) => {
        if (
          parser.hooks.determineNodeType.call(localValue) === NodeType.Switch ||
          hasSwitchKey(localKey)
        ) {
          const localSwitch = parser.hooks.parseNode.call(
            hasSwitchKey(localKey) ? { [localKey]: localValue } : localValue,
            NodeType.Value,
            options,
            NodeType.Switch
          );

          if (localSwitch) {
            let newPath = [...path, localKey];
            let newValue = localSwitch;

            if (
              localSwitch.type === NodeType.Value &&
              localSwitch.children?.length === 1 &&
              localSwitch.value === undefined
            ) {
              const firstChild = localSwitch.children[0];
              newPath = [...newPath, ...firstChild.path];
              newValue = firstChild.value;
            }

            return [{ path: newPath, value: newValue }];
          }

          return [];
        }
      }
    );
  }

  applyResolver(resolver: Resolver) {
    /** Switches resolved during the parsing phase are dynamic */
    resolver.hooks.beforeResolve.tap('switch', (node, options) => {
      if (node && node.type === NodeType.Switch && node.dynamic) {
        return this.resolveSwitch(node, options);
      }

      return node;
    });
  }

  apply(view: View) {
    view.hooks.parser.tap('switch', this.applyParser.bind(this));
    view.hooks.resolver.tap('switch', this.applyResolver.bind(this));
  }
}
