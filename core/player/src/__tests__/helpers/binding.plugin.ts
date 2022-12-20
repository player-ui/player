import type { FormatType } from '../../schema';
import type { ValidationController } from '../../controllers/validation';
import type { Player, PlayerPlugin } from '../../player';

/**
 * Adds a validation provider to the validator registry
 *
 * @param vc - validation controller
 */
export const addValidator = (vc: ValidationController) => {
  vc.hooks.createValidatorRegistry.tap('test', (registry) => {
    registry.register<{
      /** specific names to match against */
      names: string[];
    }>('names', (context, val, options) => {
      if (options?.names?.includes(val)) {
        return undefined;
      }

      return {
        message: `Names just be in: ${options?.names?.join(',')}`,
      };
    });

    registry.register<any>('expression', (context, value, options) => {
      if (options?.exp === undefined) {
        return;
      }

      const result = context.evaluate(options.exp);

      if (!result) {
        return { message: 'Expression evaluation failed' };
      }
    });

    registry.register('required', (context, value) => {
      if (value === undefined || value === null || value === '') {
        return {
          message: 'A value is required',
          severity: 'error',
        };
      }
    });

    registry.register<any>('integer', (context, value) => {
      if (typeof value !== 'number' || Math.floor(value) !== value) {
        return {
          message: 'Value must be an integer',
          parameters: {
            type: typeof value,
            flooredValue: Math.floor(value),
            value,
          },
          severity: 'error',
        };
      }
    });
  });
};

/** A plugin that tracks bindings and attaches validations to anything w/ a binding property */
export default class TrackBindingPlugin implements PlayerPlugin {
  name = 'track-binding';

  apply(player: Player) {
    player.hooks.validationController.tap(this.name, (validationProvider) => {
      addValidator(validationProvider);
    });
    const indexFormatter: FormatType<
      number,
      string,
      {
        /**
         * @param
         * @ignore
         */
        options: Array<string>;
      }
    > = {
      name: 'indexOf',
      format: (val, options) => {
        if (typeof val === 'number' && options?.options) {
          return options.options[val];
        }

        return undefined;
      },
      deformat: (val, options) => {
        if (typeof val === 'string' && options?.options) {
          return options.options.indexOf(val);
        }
      },
    };

    player.hooks.schema.tap('test', (schema) => {
      schema.addFormatters([indexFormatter] as any);
    });

    player.hooks.viewController.tap('test', (vc) => {
      vc.hooks.view.tap('test', (view) => {
        view.hooks.resolver.tap('test', (resolver) => {
          resolver.hooks.resolve.tap('test', (val, node, options) => {
            if (val?.binding) {
              options.validation?.track(val.binding);
              const valObj = options.validation?.get(val.binding);

              if (valObj) {
                return {
                  ...val,
                  validation: valObj,
                  allValidations: options.validation?.getAll(),
                };
              }
            }

            return val;
          });
        });
      });
    });
  }
}
