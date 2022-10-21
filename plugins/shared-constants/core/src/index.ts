import type { Player, PlayerPlugin } from '@player-ui/player';
import { BindingInstance } from '@player-ui/player';
import get from 'dlv';

export interface ConstantsPluginConfig {
  /** Constants defined in an Content */
  data: any;

  /** Namespace to store the constants under. If none is specified it defaults to constants */
  namespace?: string;

  /** Path to data in the content root to apply as temporary data */
  dataPath?: string;
}

/**
 * A plugin to manage constant strings across flows
 * It allows for runtime extensions/overrides through a `constants` property in the flow
 */
export class ConstantsPlugin implements PlayerPlugin {
  name = 'constants';

  /**
   * Namespace to store the constants under
   * If none is specified it defaults to constants
   */
  private namespace: string;

  /** Constants defined in an Content */
  private data: Record<string, any>;

  /** Path to data in the content root to apply as temporary data */
  private dataPath: BindingInstance;

  /** Functions to update the constants within applied players */
  private updatePlayerConstants: Set<() => void> = new Set();

  /**
   * Store the initial constants in the constant map
   */
  constructor(params: ConstantsPluginConfig) {
    this.data = params.data;
    this.namespace = params.namespace ?? 'constants';
    this.dataPath = new BindingInstance(
      params.dataPath ?? ['data', 'constants']
    );
  }

  /**
   * Grab constants from content then store them store them over after every content
   */
  apply(player: Player) {
    /** Update constants for this player */
    const updatePlayerConstants = () =>
      player.constantsController.addConstants(this.data, this.namespace);
    updatePlayerConstants();

    // Setup hook to load latest constants and flow specific overrides to constants
    player.hooks.onStart.tap(this.name, (flowObj) => {
      this.updatePlayerConstants.add(updatePlayerConstants);
      updatePlayerConstants();

      const tempData = get(flowObj, this.dataPath.asString()) ?? {};
      player.constantsController.clearTemporaryValues();
      player.constantsController.setTemporaryValues(tempData, this.namespace);
    });
    // Clear flow specific overrides at the end of the flow and remove strong ref to player
    player.hooks.onEnd.tap(this.name, () => {
      player.constantsController.clearTemporaryValues();

      this.updatePlayerConstants.delete(updatePlayerConstants);
    });
  }

  /** Update constants for all active players */
  private updateConstants() {
    this.updatePlayerConstants.forEach((update) => update());
  }

  /** Get constants for this namespace */
  getConstants(): any {
    return this.data;
  }

  /** Update constants for this namespace */
  setConstants(data: any) {
    this.data = data;
    this.updateConstants();
  }
}
