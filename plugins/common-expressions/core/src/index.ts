import type { Player, PlayerPlugin } from '@player-ui/player';
import { ExpressionPlugin } from '@player-ui/expression-plugin';
import * as Expressions from './expressions';

/**
 * Exposes a lot of expressions to Player.
 */
export class CommonExpressionsPlugin implements PlayerPlugin {
  name = 'CommonExpressions';

  apply(player: Player) {
    player.registerPlugin(
      new ExpressionPlugin(new Map(Object.entries(Expressions)))
    );
  }
}
