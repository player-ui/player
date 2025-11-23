import type { Player, PlayerPlugin, Node } from "@player-ui/player";
import { resolveDataRefsInString, NodeType } from "@player-ui/player";
import type { Mappers, MarkdownAsset } from "./types";
import { parseAssetMarkdownContent } from "./utils";

export * from "./types";

/** Type guard to identify a markdown asset node */
function isMarkdownAssetNode(
  node: Node.Node,
): node is Node.Asset<MarkdownAsset> {
  if (node.type !== NodeType.Asset) return false;
  return node.value.type === "markdown";
}

/**
 * A plugin that parses markdown written into text assets using the given converters for markdown features into existing assets.
 */
export class MarkdownPlugin implements PlayerPlugin {
  name = "MarkdownPlugin";

  private mappers: Mappers;

  constructor(mappers: Mappers) {
    this.mappers = mappers;
  }

  apply(player: Player): void {
    player.hooks.view.tap(this.name, (view) => {
      view.hooks.resolver.tap(this.name, (resolver) => {
        resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
          if (node && isMarkdownAssetNode(node)) {
            const rawValue = node.value.value ?? "";

            const resolvedContent = resolveDataRefsInString(rawValue, {
              evaluate: options.evaluate,
              model: options.data.model,
            });

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
