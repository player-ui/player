import type { View, ViewPlugin } from './plugin';
import type { Options } from './options';
import type { Parser, Node } from '../parser';
import { EMPTY_NODE, NodeType } from '../parser';
import type { Resolver } from '../resolver';

/** A view plugin to resolve switches */
export default class SwitchPlugin implements ViewPlugin {
  private readonly options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  private resolveSwitch(node: Node.Switch, options: Options): Node.Node {
    console.log('cases', node.cases.length)
    for (const switchCase of node.cases) {
      const isApplicable = options.evaluate(switchCase.case);
      console.log('evaluating switch case: ', isApplicable, switchCase)

      if (isApplicable) {
        console.log(`${isApplicable}returning switch: `, switchCase, "children: ", switchCase.value.children)
        switchCase.value.children.forEach(console.log)
        return switchCase.value;
      }
    }

    console.log("returning empty node")
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
