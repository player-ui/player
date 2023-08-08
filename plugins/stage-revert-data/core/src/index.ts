import type { Player, DataController, PlayerPlugin } from '@player-ui/player';
import { ValidationMiddleware } from '@player-ui/player';

/**
 * this plugin is supposed to stage/store changes in a local object/cache, until a transition happens,
 *  then changes are committed to the Data Model
 */
export default class StageRevertDataPlugin implements PlayerPlugin {
  name = 'stage-revert-data-plugin';

  apply(player: Player) {
    let dataController: DataController;
    let commitTransitions: string[];
    let stageData: string;
    let commitShadowModel = false;

    const GatedDataMiddleware = new ValidationMiddleware(
      () =>
        commitShadowModel
          ? undefined
          : {
              message: 'staging data',
              severity: 'error',
            },
      { shouldIncludeInvalid: () => true }
    );

    /**
     * Tapping into data controller hook to intercept data before it gets committed to data model,
     * we are using an instance of ValidationMiddleware when tapping the resolveDataStages hook on DataController
     */
    player.hooks.dataController.tap(this.name, (dc: DataController) => {
      dataController = dc;

      dc.hooks.resolveDataStages.tap(this.name, (dataPipeline) => {
        return stageData
          ? [...dataPipeline, GatedDataMiddleware]
          : [...dataPipeline];
      });
    });

    /**
     * Tapping into flow controller flow hook to detect transition, then proceed to commit to the data model from the shadowModelPaths
     * in the ValidationMiddleware, if transition has not happened then nothing happens, but if an invalid Next transition happens then
     * shadowModelPaths cache is cleared.
     */

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, (from, to) => {
          if (from) {
            if (commitTransitions.includes(to.name)) {
              commitShadowModel = true;
              player.logger.debug(
                'Shadow Model Data to be committed %s',
                GatedDataMiddleware.shadowModelPaths
              );
              dataController.set(GatedDataMiddleware.shadowModelPaths);
            }

            commitShadowModel = false;
            GatedDataMiddleware.shadowModelPaths.clear();
          }
        });
      });
    });

    /**
     * Tapping the view controller to see if we want to intercept and cache data before model
     */
    player.hooks.viewController.tap(this.name, (vc) => {
      vc.hooks.resolveView.intercept({
        call: (view, id, state) => {
          stageData = state?.attributes?.stageData;
          commitTransitions = state?.attributes?.commitTransitions;
        },
      });
    });
  }
}
