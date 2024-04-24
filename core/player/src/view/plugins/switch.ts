import type { View, ViewPlugin } from './plugin';
import type { Options } from './options';
import type { Parser, Node, ParseObjectOptions } from '../parser';
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
      console.log('@@ resolveSwitch[isApplicable]',isApplicable)
      if (isApplicable) {
        return switchCase.value;
      }
    }

    console.log('@@ resolveSwitch[node.cases] are false. should return empty node')
    return EMPTY_NODE;
  }

  applyParser(parser: Parser) {
    /** Switches resolved during the parsing phase are static */
    parser.hooks.onCreateASTNode.tap('switch', (node) => {
      if (node && node.type === NodeType.Switch && !node.dynamic) {
        return this.resolveSwitch(node, this.options);
      }

      console.log('@@ ApplyParse onCreateASTNODE[ Returning node: ',node )
      console.log('@@ ApplyParse onCreateASTNODE[ Returning nodeType: ['+node?.type+']')
      return node;
    });

    parser.hooks.determineNodeType.tap('switch', (obj) => {
      console.log('** determining switch nodetype:',obj)
      if (
        Object.prototype.hasOwnProperty.call(obj, 'dynamicSwitch') ||
        Object.prototype.hasOwnProperty.call(obj, 'staticSwitch')
      ) {
        console.log('** DETERMINED switch nodetype:',obj)
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
          console.log('@@ PARSENODE SWITCH:', obj)
          const dynamic = 'dynamicSwitch' in obj;
          const switchContent =
            'dynamicSwitch' in obj ? obj.dynamicSwitch : obj.staticSwitch;

          const cases: Node.SwitchCase[] = [];

          switchContent.forEach(
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
                cases.push({
                  case: switchCaseExpr,
                  value: value as Node.Value,
                });
              }
            }
          );

          const switchAST = parser.hooks.onCreateASTNode.call(
            {
              type: NodeType.Switch,
              dynamic,
              cases,
            },
            obj
          );

          if (switchAST?.type === NodeType.Switch) {
            switchAST.cases.forEach((sCase) => {
              // eslint-disable-next-line no-param-reassign
              sCase.value.parent = switchAST;
            });
          }

          if (switchAST?.type === NodeType.Empty) {
            return null;
          }

          return switchAST ?? null;
        }
      }
    );
  }

  applyResolver(resolver: Resolver) {
    /** Switches resolved during the parsing phase are dynamic */
    resolver.hooks.beforeResolve.tap('switch', (node, options) => {
      if (node && node.type === NodeType.Switch && node.dynamic) {
        console.log('@@ applyResolver | beforeResolve calling resolveSwitch', node)
        return this.resolveSwitch(node, options);
      }

      console.log('@@ applyResolver not a switch', node)
      return node;
    });
  }

  apply(view: View) {
    view.hooks.parser.tap('switch', this.applyParser.bind(this));
    view.hooks.resolver.tap('switch', this.applyResolver.bind(this));
  }
}
