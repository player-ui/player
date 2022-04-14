import type { Player, PlayerPlugin } from '@player-ui/player';
import type { Registry } from '@player-ui/partial-match-registry';
import type { Asset } from '@player-ui/types';

/**
 * A player plugin to manage partial-match-mappings by asset id
 * Automatically keeps track of all resolved asset id's and the value they match to in
 * the partial match registry
 */
export class PartialMatchFingerprintPlugin implements PlayerPlugin {
  name = 'partial-match-fingerprint';
  private registry: Registry<any>;
  private mapping: Map<string, any>;

  constructor(registry: Registry<any>) {
    this.registry = registry;
    this.mapping = new Map<string, any>();
  }

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        view.hooks.resolver.tap(this.name, (resolver) => {
          resolver.hooks.afterResolve.tap(this.name, (resolved, node) => {
            if (
              (resolved && node && node.type === 'asset') ||
              node.type === 'view'
            ) {
              this.mapping.set(
                (resolved as Asset).id,
                this.registry.get(resolved as Asset)
              );
            }
          });
        });
      });
    });
  }

  register(match: any, value: any) {
    this.registry.set(match, value);
  }

  get(assetId: string) {
    return this.mapping.get(assetId);
  }
}
