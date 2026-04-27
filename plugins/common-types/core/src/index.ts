import type { Player, ExtendedPlayerPlugin } from "@player-ui/player";
import { TypesProviderPlugin } from "@player-ui/types-provider-plugin";

import * as validators from "./validators";
import * as dataTypes from "./data-types/types";
import * as formats from "./formats";
import {
  BooleanType,
  IntegerType,
  IntegerPosType,
  IntegerNNType,
  StringType,
  CollectionType,
  DateType,
  PhoneType,
} from "./data-types/types";

import { commaNumber, currency, date, integer, phone } from "./formats/index";

import {
  collection,
  email,
  expression,
  integer as vinteger,
  length,
  max,
  min,
  oneOf,
  phone as vphone,
  readonly,
  regex,
  required,
  string,
  zip,
} from "./validators/index";

export { validators, dataTypes, formats };

export * from "./formats/utils";

/**
 * Exposes a lot of common DataTypes, validations, and formats to Player instance.
 */
export class CommonTypesPlugin implements ExtendedPlayerPlugin<
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
    typeof PhoneType,
  ],
  [
    typeof commaNumber,
    typeof currency,
    typeof date,
    typeof integer,
    typeof phone,
  ],
  [
    typeof collection,
    typeof email,
    typeof expression,
    typeof vinteger,
    typeof length,
    typeof max,
    typeof min,
    typeof oneOf,
    typeof vphone,
    typeof readonly,
    typeof regex,
    typeof required,
    typeof string,
    typeof zip,
  ]
> {
  name = "CommonTypes";

  apply(player: Player): void {
    player.registerPlugin(
      new TypesProviderPlugin({
        types: Object.values(dataTypes),
        formats: Object.values(formats),
        validators: Object.entries(validators),
      }),
    );
  }
}
