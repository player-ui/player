import type { Player, PlayerPlugin } from "@player-ui/player";
import { TypesProviderPlugin } from "@player-ui/types-provider-plugin";
import {
  emailValidator,
  lengthValidator,
  numericValidator,
  regexValidator,
  requiredValidator,
} from "../expressions/validation";

/** Player validation types keyed by the A2UI check `call` name they implement. */
const validators = {
  required: requiredValidator,
  regex: regexValidator,
  length: lengthValidator,
  numeric: numericValidator,
  email: emailValidator,
};

/**
 * Registers the a2ui check functions (required, regex, length, numeric,
 * email) as Player validation types, so schema `validation` references
 * synthesized from A2UI `checks` (see a2ui/schema.ts CHECK_TO_VALIDATOR)
 * resolve without requiring a separate common-types registration.
 */
export class A2UIValidationPlugin implements PlayerPlugin {
  name = "a2ui-validation";

  apply(player: Player): void {
    player.registerPlugin(
      new TypesProviderPlugin({ validators: Object.entries(validators) }),
    );
  }
}
