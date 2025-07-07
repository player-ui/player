import type { ExtendedPlayerPlugin, Player } from "@player-ui/player";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import * as Expressions from "./expressions";
import type {
  size,
  length,
  isEmpty,
  isNotEmpty,
  concat,
  trim,
  upperCase,
  lowerCase,
  replace,
  titleCase,
  sentenceCase,
  split,
  substr,
  number,
  round,
  floor,
  ceil,
  sum,
  findPropertyIndex,
  findProperty,
  containsAny,
} from "./expressions";

export { Expressions };

/**
 * Exposes a lot of expressions to Player.
 */
export class CommonExpressionsPlugin
  implements
    ExtendedPlayerPlugin<
      [],
      [],
      [
        typeof size,
        typeof length,
        typeof isEmpty,
        typeof isNotEmpty,
        typeof concat,
        typeof trim,
        typeof upperCase,
        typeof lowerCase,
        typeof replace,
        typeof titleCase,
        typeof sentenceCase,
        typeof split,
        typeof substr,
        typeof number,
        typeof round,
        typeof floor,
        typeof ceil,
        typeof sum,
        typeof findPropertyIndex,
        typeof findProperty,
        typeof containsAny,
      ]
    >
{
  name = "CommonExpressions";

  apply(player: Player): void {
    player.registerPlugin(
      new ExpressionPlugin(new Map(Object.entries(Expressions))),
    );
  }
}
