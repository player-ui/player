import type {
  Player,
  PlayerPlugin,
  ValidatorFunction,
  FormatType,
} from '@player-ui/player';
import type { Schema } from '@player-ui/types';

export interface TypesConfig {
  /**
   * DataTypes to expose to Player instance.
   * The schema definition in authored content can reference these to get common functionality across types
   */
  types?: Array<Schema.DataType<any>>;

  /**
   * Custom validators to add to this player instance.
   * Anything defined here will be available for use in any DataType or view-validation
   */
  validators?: Array<[string, ValidatorFunction<any>]>;

  /** A list of formats (and handler functions) to expose to DataTypes */
  formats?: Array<FormatType<any, any, any>>;
}

/**
 * The TypesProvider plugin provides an easy way for users to expose custom validators, DataTypes, or formatters to the content
 */
export class TypesProviderPlugin implements PlayerPlugin {
  name = 'TypesProviderPlugin';

  private config: TypesConfig;

  constructor(config: TypesConfig) {
    this.config = config;
  }

  apply(player: Player) {
    player.hooks.schema.tap(this.name, (schema) => {
      if (this.config.types) {
        schema.addDataTypes(this.config.types);
      }

      if (this.config.formats) {
        schema.addFormatters(this.config.formats);
      }
    });

    if (this.config.validators) {
      player.hooks.validationController.tap(
        this.name,
        (validationController) => {
          validationController.hooks.createValidatorRegistry.tap(
            this.name,
            (validationRegistry) => {
              this.config.validators?.forEach(([name, handler]) => {
                validationRegistry.register(name, handler);
              });
            }
          );
        }
      );
    }
  }
}
