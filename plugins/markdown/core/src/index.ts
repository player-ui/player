import type { Player, PlayerPlugin } from '@player-ui/player';
import { resolveDataRefsInString, NodeType } from '@player-ui/player';
import type { Mappers } from './types';
import { parseAssetMarkdownContent } from './utils';

export * from './types';

/**
 * A plugin that parses markdown written into text assets using the given converters for markdown features into existing assets.
 */
export class MarkdownPlugin implements PlayerPlugin {
  name = 'MarkdownPlugin';

  private mappers: Mappers;

  constructor(mappers: Mappers) {
    this.mappers = mappers;
  }

  apply(player: Player) {
    player.hooks.view.tap(this.name, (view) => {
      view.hooks.resolver.tap(this.name, (resolver) => {
        resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
          if (node?.type === NodeType.Asset && node.value.type === 'markdown') {
            const resolvedContent = resolveDataRefsInString(
              node.value.value as string,
              {
                evaluate: options.evaluate,
                model: options.data.model,
              }
            );

            const parsed = parseAssetMarkdownContent({
              asset: {
                ...node.value,
                value: resolvedContent,
              },
              mappers: this.mappers,
              parser: options.parseNode,
            });

            return parsed;
          }

          return node;
        });
      });
    });
  }
}
