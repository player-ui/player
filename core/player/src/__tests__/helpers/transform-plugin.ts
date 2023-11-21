import type { Player, PlayerPlugin } from '../..';

/** Just need something quick to use in tests */
export class AssetTransformPlugin implements PlayerPlugin {
  name = 'asset-transform-test';
  public readonly registry: Array<[string, any]>;

  constructor(transforms: Array<[string, any]>) {
    this.registry = transforms;
  }

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (vc) => {
      this.registry.forEach(([key, value]) =>
        vc.transformRegistry.set(key, value),
      );
    });
  }
}
