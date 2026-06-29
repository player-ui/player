import type { Player, PlayerPlugin } from "@player-ui/player";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import { a2uiExpressions } from "../expressions";

/**
 * Registers the standard A2UI v0.9.1 expression functions (required, regex,
 * formatNumber, openUrl, and, …) so adapter-produced `@[fn(...)]@` calls
 * evaluate. Names land in Player's evaluator verbatim — no namespace.
 */
export class A2UIExpressionsPlugin implements PlayerPlugin {
  name = "a2ui-expressions";

  apply(player: Player): void {
    player.registerPlugin(
      new ExpressionPlugin(new Map(Object.entries(a2uiExpressions))),
    );
  }
}
