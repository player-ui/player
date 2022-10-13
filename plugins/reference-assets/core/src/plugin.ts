import type {
  Player,
  PlayerPlugin,
  ExtendedPlayerPlugin,
} from '@player-ui/player';
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import type {
  ActionAsset,
  CollectionAsset,
  InfoAsset,
  InputAsset,
  TextAsset,
} from './assets';
import { inputTransform, actionTransform } from './assets';

/**
 * A plugin to add transforms for the reference assets
 */
export class ReferenceAssetsPlugin
  implements
    PlayerPlugin,
    ExtendedPlayerPlugin<
      [InputAsset, TextAsset, ActionAsset, InfoAsset, CollectionAsset]
    >
{
  name = 'reference-assets-transforms';

  apply(player: Player) {
    player.registerPlugin(
      new AssetTransformPlugin([
        [{ type: 'action' }, actionTransform],
        [{ type: 'input' }, inputTransform],
      ])
    );
  }
}
