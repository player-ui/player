import type { Validation } from '@player-ui/types';
import { SyncHook, SyncWaterfallHook } from 'tapable-ts';

import type { BindingInstance, BindingFactory } from '../../binding';
import { isBinding } from '../../binding';
import type { DataModelWithParser, DataModelMiddleware } from '../../data';
import type { SchemaController } from '../../schema';
import type {
  ErrorValidationResponse,
  ValidationObject,
  ValidatorContext,
  ValidationProvider,
  ValidationResponse,
  WarningValidationResponse,
} from '../../validator';
import { ValidationMiddleware, ValidatorRegistry } from '../../validator';
import type { Logger } from '../../logger';
import { ProxyLogger } from '../../logger';
import type { Resolve, ViewInstance } from '../../view';
import { caresAboutDataChanges } from '../../view';
import { replaceParams } from '../../utils';
import { resolveDataRefs } from '../../string-resolver';
import type {
  ExpressionEvaluatorOptions,
  ExpressionType,
} from '../../expressions';
import type { BindingTracker } from './binding-tracker';
import { ValidationBindingTrackerViewPlugin } from './binding-tracker';

type SimpleValidatorContext = Omit<ValidatorContext, 'validation'>;

interface BaseActiveValidation<T> {
  /** The validation is being actively shown */
  state: 'active';

  /** The validation response */
  response: T;
}

type ActiveWarning = BaseActiveValidation<WarningValidationResponse> & {
  /** Warnings track if they can be dismissed automatically (by navigating) */
  dismissable: boolean;
};
type ActiveError = BaseActiveValidation<ErrorValidationResponse>;

/**
 * warnings that keep track of their active state
 */
type StatefulWarning = {
  /** A common key to differentiate between errors and warnings */
  type: 'warning';

  /** The underlying validation this tracks */
  value: ValidationObject;
} & (
  | {
      /** warnings start with no state, but can active or dismissed */
      state: 'none' | 'dismissed';
    }
  | ActiveWarning
);

/** Errors that keep track of their state */
type StatefulError = {
  /** A common key to differentiate between errors and warnings */
  type: 'error';

  /** The underlying validation this tracks */
  value: ValidationObject;
} & (
  | {
      /** Errors start with no state an can be activated */
      state: 'none';
    }
  | ActiveError
);

export type StatefulValidationObject = StatefulWarning | StatefulError;

/** Helper for initializing a validation object that tracks state */
function createStatefulValidationObject(
  obj: ValidationObject
): StatefulValidationObject {
  return {
    value: obj,
    type: obj.severity,
    state: 'none',
  };
}

type ValidationRunner = (obj: ValidationObject) =>
  | {
      /** A validation message */
      message: string;
    }
  | undefined;

/** A class that manages validating bindings across phases */
class ValidatedBinding {
  private currentPhase?: Validation.Trigger;
  private applicableValidations: Array<StatefulValidationObject> = [];
  private validationsByState: Record<
    Validation.Trigger,
    Array<StatefulValidationObject>
  > = {
    load: [],
    change: [],
    navigation: [],
  };

  public weakBindings: Set<BindingInstance>;
  private onDismiss?: () => void;

  constructor(
    possibleValidations: Array<ValidationObject>,
    onDismiss?: () => void,
    log?: Logger,
    weakBindings?: Set<BindingInstance>
  ) {
    this.onDismiss = onDismiss;
    possibleValidations.forEach((vObj) => {
      const { trigger } = vObj;

      if (this.validationsByState[trigger]) {
        this.validationsByState[trigger].push(
          createStatefulValidationObject(vObj)
        );
      } else {
        log?.warn(`Unknown validation trigger: ${trigger}`);
      }
    });
    this.weakBindings = weakBindings ?? new Set();
  }

  public get(): ValidationResponse | undefined {
    const firstError = this.applicableValidations.find((statefulObj) => {
      const blocking =
        this.currentPhase === 'navigation' ? statefulObj.value.blocking : true;
      return statefulObj.state === 'active' && blocking !== false;
    });

    if (firstError?.state === 'active') {
      return firstError.response;
    }
  }

  private runApplicableValidations(
    runner: ValidationRunner,
    canDismiss: boolean
  ) {
    // If the currentState is not load, skip those
    this.applicableValidations = this.applicableValidations.map((obj) => {
      if (obj.state === 'dismissed') {
        // Don't rerun any dismissed warnings
        return obj;
      }

      const blocking =
        obj.value.blocking ??
        ((obj.value.severity === 'warning' && 'once') ||
          (obj.value.severity === 'error' && true));

      const dismissable = canDismiss && blocking === 'once';

      if (
        this.currentPhase === 'navigation' &&
        obj.state === 'active' &&
        dismissable
      ) {
        if (obj.value.severity === 'warning') {
          const warn = obj as ActiveWarning;
          if (warn.dismissable && warn.response.dismiss) {
            warn.response.dismiss();
          } else {
            warn.dismissable = true;
          }

          return obj;
        }

        if (obj.value.severity === 'error') {
          const err = obj as StatefulError;
          err.state = 'none';
          return obj;
        }
      }

      const response = runner(obj.value);

      const newState = {
        type: obj.type,
        value: obj.value,
        state: response ? 'active' : 'none',
        dismissable:
          obj.value.severity === 'warning' &&
          this.currentPhase === 'navigation',
        response: response
          ? {
              ...obj.value,
              message: response.message ?? 'Something is broken',
              severity: obj.value.severity,
              displayTarget: obj.value.displayTarget ?? 'field',
            }
          : undefined,
      } as StatefulValidationObject;

      if (newState.state === 'active' && obj.value.severity === 'warning') {
        (newState.response as WarningValidationResponse).dismiss = () => {
          (newState as StatefulWarning).state = 'dismissed';
          this.onDismiss?.();
        };
      }

      return newState;
    });
  }

  public update(
    phase: Validation.Trigger,
    canDismiss: boolean,
    runner: ValidationRunner
  ) {
    if (phase === 'load' && this.currentPhase !== undefined) {
      // Tried to run the 'load' phase twice. Aborting
      return;
    }

    if (this.currentPhase === 'navigation' || phase === this.currentPhase) {
      // Already added all the types. No need to continue adding new validations
      this.runApplicableValidations(runner, canDismiss);
      return;
    }

    if (phase === 'load') {
      this.currentPhase = 'load';
      this.applicableValidations = [...this.validationsByState.load];
    } else if (phase === 'change' && this.currentPhase === 'load') {
      this.currentPhase = 'change';
      // The transition to the 'change' type can only come from a 'load' type
      this.applicableValidations = [
        ...this.applicableValidations,
        ...this.validationsByState.change,
      ];
    } else if (
      phase === 'navigation' &&
      (this.currentPhase === 'load' || this.currentPhase === 'change')
    ) {
      // Can transition to a nav state from a change or load
      this.applicableValidations = [
        ...this.applicableValidations,
        ...(this.currentPhase === 'load' ? this.validationsByState.change : []),
        ...this.validationsByState.navigation,
      ];
      this.currentPhase = 'navigation';
    }

    this.runApplicableValidations(runner, canDismiss);
  }
}

/**
 * A controller for orchestrating validation within a running player
 *
 * The current validation flow is as follows:
 *
 *   - When a binding is first seen, gather all of the possible validations for it from the providers
 *     - Schema and Crossfield (view) are both providers of possible validations
 *     - Run all of the applicable validations for that binding for the `load` trigger
 *
 *   - When a change occurs, set the phase of the binding to `change`.
 *     - Run all of the `change` triggered validations for that binding.
 *
 *   - When a navigation event occurs, set the phase of the binding to `navigate`.
 *     - Run all `change` and `navigate` validations for each tracked binding.
 *     - For any warnings, also keep a state of `shown` or `dismissed`.
 *       - Set all non-dismissed warnings to `shown`.
 *       - Set all `shown` warnings to `dismissed`.
 *     - Allow navigation forward if there are no non-dismissed warnings and no valid errors.
 */
export class ValidationController implements BindingTracker {
  public readonly hooks = {
    /** A hook called to tap into the validator registry for adding more validators */
    createValidatorRegistry: new SyncHook<[ValidatorRegistry]>(),

    /** A callback/event when a new validation is added to the view */
    onAddValidation: new SyncWaterfallHook<
      [ValidationResponse, BindingInstance]
    >(),

    /** The inverse of onAddValidation, this is called when a validation is removed from the list */
    onRemoveValidation: new SyncWaterfallHook<
      [ValidationResponse, BindingInstance]
    >(),
  };

  private tracker: BindingTracker | undefined;
  private validations = new Map<BindingInstance, ValidatedBinding>();
  private validatorRegistry?: ValidatorRegistry;
  private schema: SchemaController;
  private providers: Array<ValidationProvider>;
  private options?: SimpleValidatorContext;
  private weakBindingTracker = new Set<BindingInstance>();
  private lastActiveBindings = new Set<BindingInstance>();

  constructor(schema: SchemaController, options?: SimpleValidatorContext) {
    this.schema = schema;
    this.options = options;
    this.providers = [schema];
  }

  setOptions(options: SimpleValidatorContext) {
    this.options = options;
  }

  /** Return the middleware for the data-model to stop propagation of invalid data */
  public getDataMiddleware(): Array<DataModelMiddleware> {
    return [
      new ValidationMiddleware(
        (binding) => {
          if (!this.options) {
            return;
          }

          this.updateValidationsForBinding(binding, 'change', this.options);

          const strongValidation = this.getValidationForBinding(binding);

          // return validation issues directly on bindings first
          if (strongValidation?.get()) return strongValidation.get();

          // if none, check to see any validations this binding may be a weak ref of and return
          const newInvalidBindings: Set<BindingInstance> = new Set();
          for (const [, weakValidation] of Array.from(this.validations)) {
            if (
              caresAboutDataChanges(
                new Set([binding]),
                weakValidation.weakBindings
              ) &&
              weakValidation?.get()
            ) {
              weakValidation?.weakBindings.forEach(
                newInvalidBindings.add,
                newInvalidBindings
              );
            }
          }

          if (newInvalidBindings.size > 0) {
            return newInvalidBindings;
          }
        },
        { logger: new ProxyLogger(() => this.options?.logger) }
      ),
    ];
  }

  public onView(view: ViewInstance): void {
    this.validations.clear();

    if (!this.options) {
      return;
    }

    const bindingTrackerPlugin = new ValidationBindingTrackerViewPlugin({
      ...this.options,
      callbacks: {
        onAdd: (binding) => {
          if (!this.options) {
            return;
          }

          // Set the default value for the binding if we need to
          const originalValue = this.options.model.get(binding);
          const withoutDefault = this.options.model.get(binding, {
            ignoreDefaultValue: true,
          });

          if (originalValue !== withoutDefault) {
            this.options.model.set([[binding, originalValue]]);
          }

          this.updateValidationsForBinding(
            binding,
            'load',
            this.options,
            () => {
              view.update(new Set([binding]));
            }
          );
        },
      },
    });

    this.tracker = bindingTrackerPlugin;
    this.providers = [this.schema, view];

    bindingTrackerPlugin.apply(view);
  }

  private updateValidationsForBinding(
    binding: BindingInstance,
    trigger: Validation.Trigger,
    context: SimpleValidatorContext,
    onDismiss?: () => void
  ): void {
    if (trigger === 'load') {
      // Get all of the validations from each provider
      const possibleValidations = this.providers.reduce<
        Array<ValidationObject>
      >(
        (vals, provider) => [
          ...vals,
          ...(provider.getValidationsForBinding?.(binding) ?? []),
        ],
        []
      );

      if (possibleValidations.length === 0) {
        return;
      }

      this.validations.set(
        binding,
        new ValidatedBinding(
          possibleValidations,
          onDismiss,
          this.options?.logger
        )
      );
    }

    const trackedValidations = this.validations.get(binding);
    trackedValidations?.update(trigger, true, (validationObj) => {
      const response = this.validationRunner(validationObj, context, binding);

      if (this.weakBindingTracker.size > 0) {
        const t = this.validations.get(binding) as ValidatedBinding;
        this.weakBindingTracker.forEach((b) => t.weakBindings.add(b));
      }

      return response ? { message: response.message } : undefined;
    });

    // Also run any validations that binding or sub-binding is a weak binding of
    if (trigger !== 'load') {
      this.validations.forEach((validation, vBinding) => {
        if (
          vBinding !== binding &&
          caresAboutDataChanges(new Set([binding]), validation.weakBindings)
        ) {
          validation.update(trigger, true, (validationObj) => {
            const response = this.validationRunner(
              validationObj,
              context,
              binding
            );
            return response ? { message: response.message } : undefined;
          });
        }
      });
    }
  }

  private validationRunner(
    validationObj: ValidationObject,
    context: SimpleValidatorContext,
    binding: BindingInstance
  ) {
    const handler = this.getValidator(validationObj.type);
    const weakBindings = new Set<BindingInstance>();

    // For any data-gets in the validation runner, default to using the _invalid_ value (since that's what we're testing against)
    const model: DataModelWithParser = {
      get(b, options = { includeInvalid: true }) {
        weakBindings.add(isBinding(b) ? binding : context.parseBinding(b));
        return context.model.get(b, options);
      },
      set: context.model.set,
    };

    const result = handler?.(
      {
        ...context,
        evaluate: (
          exp: ExpressionType,
          options: ExpressionEvaluatorOptions = { model }
        ) => context.evaluate(exp, options),
        model,
        validation: validationObj,
      },
      context.model.get(binding, {
        includeInvalid: true,
        formatted: validationObj.dataTarget === 'formatted',
      }),
      validationObj
    );

    this.weakBindingTracker = weakBindings;

    if (result) {
      let { message } = result;
      const { parameters } = result;

      if (validationObj.message) {
        message = resolveDataRefs(validationObj.message, {
          model,
          evaluate: context.evaluate,
        });

        if (parameters) {
          message = replaceParams(message, parameters);
        }
      }

      return {
        message,
      };
    }
  }

  private updateValidationsForView(trigger: Validation.Trigger): void {
    const { activeBindings } = this;

    const canDismiss =
      trigger !== 'navigation' ||
      this.setCompare(this.lastActiveBindings, activeBindings);

    this.getBindings().forEach((binding) => {
      this.validations.get(binding)?.update(trigger, canDismiss, (obj) => {
        if (!this.options) {
          return;
        }

        return this.validationRunner(obj, this.options, binding);
      });
    });

    if (trigger === 'navigation') {
      this.lastActiveBindings = activeBindings;
    }
  }

  private setCompare<T>(set1: Set<T>, set2: Set<T>): boolean {
    if (set1.size !== set2.size) return false;
    for (const entry of set1) if (!set2.has(entry)) return false;
    return true;
  }

  private get activeBindings(): Set<BindingInstance> {
    return new Set(
      Array.from(this.getBindings()).filter(
        (b) => this.validations.get(b)?.get() !== undefined
      )
    );
  }

  public getValidator(type: string) {
    if (this.validatorRegistry) {
      return this.validatorRegistry.get(type);
    }

    const registry = new ValidatorRegistry();
    this.hooks.createValidatorRegistry.call(registry);
    this.validatorRegistry = registry;

    return registry.get(type);
  }

  getBindings(): Set<BindingInstance> {
    return this.tracker?.getBindings() ?? new Set();
  }

  /** Executes all known validations for the tracked bindings using the given model */
  validateView(trigger: Validation.Trigger = 'navigation'): {
    /** Indicating if the view can proceed without error */
    canTransition: boolean;

    /** the validations that are preventing the view from continuing */
    validations?: Map<BindingInstance, ValidationResponse>;
  } {
    this.updateValidationsForView(trigger);

    const validations = new Map<BindingInstance, ValidationResponse>();

    for (const b of this.getBindings()) {
      const invalid = this.getValidationForBinding(b)?.get();

      if (invalid) {
        this.options?.logger.debug(
          `Validation on binding: ${b.asString()} is preventing navigation. ${JSON.stringify(
            invalid
          )}`
        );

        validations.set(b, invalid);
      }
    }

    return {
      canTransition: validations.size === 0,
      validations: validations.size ? validations : undefined,
    };
  }

  public getValidationForBinding(
    binding: BindingInstance
  ): ValidatedBinding | undefined {
    return this.validations.get(binding);
  }

  forView(parser: BindingFactory): Resolve.Validation {
    return {
      _getValidationForBinding: (binding) => {
        return this.getValidationForBinding(
          isBinding(binding) ? binding : parser(binding)
        )?.get();
      },
      getAll: () => {
        const bindings = this.getBindings();

        if (bindings.size === 0) {
          return undefined;
        }

        const validationMapping = new Map<
          BindingInstance,
          ValidationResponse
        >();

        bindings.forEach((b) => {
          const validation = this.getValidationForBinding(b)?.get();

          if (validation) {
            validationMapping.set(b, validation);
          }
        });

        return validationMapping.size === 0 ? undefined : validationMapping;
      },
      get() {
        throw new Error('Error Access be provided by the view plugin');
      },
      getChildren() {
        throw new Error('Error rollup should be provided by the view plugin');
      },
      getValidationsForSection() {
        throw new Error('Error rollup should be provided by the view plugin');
      },
      track: () => {
        throw new Error('Tracking should be provided by the view plugin');
      },
      register: () => {
        throw new Error(
          'Section funcationality hould be provided by the view plugin'
        );
      },
      type: (binding) =>
        this.schema.getType(isBinding(binding) ? binding : parser(binding)),
    };
  }
}
