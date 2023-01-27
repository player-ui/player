import type { Player, ExtendedPlayerPlugin } from '@player-ui/player';
import { TypesProviderPlugin } from '@player-ui/types-provider-plugin';

import * as validators from './validators';
import * as dataTypes from './data-types/types';
import * as dataRefs from './data-types/refs';
import * as formats from './formats';
import type {
  BooleanType,
  IntegerType,
  IntegerPosType,
  IntegerNNType,
  StringType,
  CollectionType,
  DateType,
  PhoneType,
} from './data-types/types';

export { validators, dataTypes, dataRefs, formats };
export * from './formats/utils';

/**
 * Exposes a lot of common DataTypes, validations, and formats to Player instance.
 */
export class CommonTypesPlugin
  implements
    ExtendedPlayerPlugin<
      [],
      [],
      [],
      [
        typeof BooleanType,
        typeof IntegerType,
        typeof IntegerPosType,
        typeof IntegerNNType,
        typeof StringType,
        typeof CollectionType,
        typeof DateType,
        typeof PhoneType
      ]
    >
{
  name = 'CommonTypes';

  apply(player: Player) {
    player.registerPlugin(
      new TypesProviderPlugin({
        types: Object.values(dataTypes),
        formats: Object.values(formats),
        validators: Object.entries(validators),
      })
    );
  }
}
