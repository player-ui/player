import type { Player, PlayerPlugin } from "../../player";

export class ActionExpPlugin implements PlayerPlugin {
  name = "action-plugin";

  apply(player: Player) {
    player.hooks.view.tap("test", (view) => {
      view.hooks.resolver.tap("test", (resolver) => {
        resolver.hooks.beforeResolve.tap("test", (n) => {
          return {
            ...n,
            plugins: {
              stringResolver: {
                propertiesToSkip: ["exp"],
              },
            },
          };
        });
      });
    });
  }
}
