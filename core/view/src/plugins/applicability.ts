import type { ViewPlugin, View } from './plugin';
import type { Options } from './options';
import type { Resolver } from '../resolver';
import type { Node } from '../parser';
import { NodeType } from '../parser';

/** A view plugin to remove inapplicable assets from the tree */
export default class ApplicabilityPlugin implements ViewPlugin {
  applyResolver(resolver: Resolver) {
    resolver.hooks.beforeResolve.tap(
      'applicability',
      (node: Node.Node | null, options: Options) => {
        let newNode = node;

        if (node?.type === NodeType.Applicability) {
          const isApplicable = options.evaluate(node.expression);

          if (!isApplicable) {
            return null;
          }

          newNode = node.value;
        }

        return newNode;
      }
    );
  }

  apply(view: View) {
    view.hooks.resolver.tap('applicability', this.applyResolver.bind(this));
  }
}
