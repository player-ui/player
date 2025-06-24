import { AssetTransformCorePlugin } from "../controllers";
import type { Player, PlayerPlugin } from "../player";
import {
  ApplicabilityPlugin,
  AssetPlugin,
  MultiNodePlugin,
  StringResolverPlugin,
  SwitchPlugin,
  TemplatePlugin,
  toNodeResolveOptions,
} from "../view";

/**
 * A plugin that provides the out-of-the-box expressions for player
 */
export class DefaultViewPlugin implements PlayerPlugin {
  name = "default-view-plugin";

  apply(player: Player) {
    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        const pluginOptions = toNodeResolveOptions(view.resolverOptions);
        new AssetPlugin().apply(view);
        new SwitchPlugin(pluginOptions).apply(view);
        new ApplicabilityPlugin().apply(view);
        new AssetTransformCorePlugin(viewController.transformRegistry).apply(view);
        new StringResolverPlugin().apply(view);
        const templatePlugin = new TemplatePlugin(pluginOptions);
        templatePlugin.apply(view);
        view.hooks.onTemplatePluginCreated.call(templatePlugin);
        new MultiNodePlugin().apply(view);
      });
    });
  }
}
