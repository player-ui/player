import type { Player, PlayerPlugin } from '@player-ui/player';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { inputTransform, actionTransform, choiceTransform } from './assets';
import { inputTransform, actionTransform, infoTransform } from './assets';

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin implements PlayerPlugin {
  name = 'reference-assets-transforms';

  apply(player: Player) {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: 'action' }, actionTransform],
        [{ type: 'input' }, inputTransform],
        [{ type: 'choice' }, choiceTransform],
        [{ type: 'info' }, infoTransform],
      ])
    );
  }
}
