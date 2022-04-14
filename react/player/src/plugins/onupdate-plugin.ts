import type { Player, PlayerPlugin, ViewInstance } from '@player-ui/player';

export type OnUpdateCallback = (update: any) => void;

/**
 * A plugin that listens for view updates and publishes an event for when a view is updated
 */
export default class OnUpdatePlugin implements PlayerPlugin {
  name = 'view-update';

  private readonly onUpdateCallback: OnUpdateCallback;

  constructor(onUpdate: OnUpdateCallback) {
    this.onUpdateCallback = onUpdate;
  }

  apply(player: Player) {
    /** Trigger the callback for the view update */
    const updateTap = (updatedView: any) => {
      this.onUpdateCallback(updatedView);
    };

    /** Trigger the callback for the view creation  */
    const viewTap = (view: ViewInstance) => {
      view.hooks.onUpdate.tap(this.name, updateTap);
    };

    // Attach hooks for any new vc that gets created
    player.hooks.view.tap(this.name, viewTap);

    // Attach listeners and publish an update event for a view already in progress
    const currentPlayerState = player.getState();

    if (currentPlayerState.status === 'in-progress') {
      const { currentView } = currentPlayerState.controllers.view;

      if (currentView) {
        viewTap(currentView);
        const { lastUpdate } = currentView;

        if (lastUpdate) {
          this.onUpdateCallback(lastUpdate);
        }
      }
    }
  }
}
