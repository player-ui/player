import type { TransformFunction, Asset, Flow, View, PlayerPlugin } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { AssetTransformPlugin } from '@player-ui/asset-transform-plugin';
import { makeFlow } from '@player-ui/make-flow';

/**
 * A testing utility for transforms
 */
export function runTransform<
  BaseAssetType extends Asset,
  TransformedAssetType extends Asset = BaseAssetType
>(
  type: string,
  transform: TransformFunction<BaseAssetType, TransformedAssetType>,
  content: BaseAssetType | Flow | Array<View>,
  plugins: PlayerPlugin[] = [],
) {
  const player = new Player({
    plugins: [new AssetTransformPlugin([[{ type }, transform]]), ...plugins],
  });

  player.start(makeFlow(content));

  return {
    player,
    get current() {
      const status = player.getState();
      if (status.status === 'in-progress') {
        const view = status.controllers.view.currentView?.lastUpdate;
        if (view) {
          return view as TransformedAssetType;
        }
      }
    },
    get controllers() {
      const status = player.getState();
      if (status.status === 'in-progress') {
        return status.controllers;
      }
    },
  };
}
