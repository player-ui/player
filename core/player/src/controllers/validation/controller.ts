import type { Validation } from '@player-ui/types';
import { SyncHook, SyncWaterfallHook } from 'tapable-ts';
import { setIn } from 'timm';

import type { BindingInstance, BindingFactory } from '../../binding';
import { isBinding } from '../../binding';
import type { DataModelWithParser, DataModelMiddleware } from '../../data';
import type { SchemaController } from '../../schema';
import type {
  ErrorValidationResponse,
  ValidationObject,
  ValidationObjectWithHandler,
  ValidatorContext,
  ValidationProvider,
  ValidationResponse,
  WarningValidationResponse,
  StrongOrWeakBinding,
} from '../../validator';
import {
  ValidationMiddleware,
  ValidatorRegistry,
  removeBindingAndChildrenFromMap,
} from '../../validator';
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

export const SCHEMA_VALIDATION_PROVIDER_NAME = 'schema';
export const VIEW_VALIDATION_PROVIDER_NAME = 'view';

export const VALIDATION_PROVIDER_NAME_SYMBOL: unique symbol = Symbol.for(
  'validation-provider-name'
);

export type ValidationObjectWithSource = ValidationObjectWithHandler & {
  /** The name of the validation */
  [VALIDATION_PROVIDER_NAME_SYMBOL]: string;
};

type SimpleValidatorContext = Omit<
  ValidatorContext,
  'validation' | 'schemaType'
>;

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
  value: ValidationObjectWithSource;

  /** If this is currently preventing navigation from continuing */
  isBlockingNavigation: boolean;
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
  value: ValidationObjectWithSource;

  /** If this is currently preventing navigation from continuing */
  isBlockingNavigation: boolean;
} & (
  | {
      /** Errors start with no state an can be activated */
      state: 'none';
    }
  | ActiveError
);

export type StatefulValidationObject = StatefulWarning | StatefulError;

/** Helper function to determin if the subset is within the containingSet */
function isSubset<T>(subset: Set<T>, containingSet: Set<T>): boolean {
  if (subset.size > containingSet.size) return false;
  for (const entry of subset) if (!containingSet.has(entry)) return false;
  return true;
}

/** Helper for initializing a validation object that tracks state */
function createStatefulValidationObject(
  obj: ValidationObjectWithSource
): StatefulValidationObject {
  return {
    value: obj,
    type: obj.severity,
    state: 'none',
    isBlockingNavigation: false,
  };
}

type ValidationRunner = (obj: ValidationObjectWithHandler) =>
  | {
      /** A validation message */
      message: string;
    }
  | undefined;

/** A class that manages validating bindings across phases */
class ValidatedBinding {
  public currentPhase?: Validation.Trigger;
  private applicableValidations: Array<StatefulValidationObject> = [];
  private validationsByState: Record<
    Validation.Trigger,
    Array<StatefulValidationObject>
  > = {
    load: [],
    change: [],
    navigation: [],
  };

  public get allValidations(): Array<StatefulValidationObject> {
    return Object.values(this.validationsByState).flat();
  }

  public weakBindings: Set<BindingInstance>;

  private onDismiss?: () => void;

  constructor(
    possibleValidations: Array<ValidationObjectWithSource>,
    onDismiss?: () => void,
    log?: Logger,
    weakBindings?: Set<BindingInstance>
  ) {
    this.onDismiss = onDismiss;
    possibleValidations.forEach((vObj) => {
      const { trigger } = vObj;

      if (this.validationsByState[trigger]) {
        const statefulValidationObject = createStatefulValidationObject(vObj);
        this.validationsByState[trigger].push(statefulValidationObject);
      } else {
        log?.warn(`Unknown validation trigger: ${trigger}`);
      }
    });
    this.weakBindings = weakBindings ?? new Set();
  }

  private checkIfBlocking(statefulObj: StatefulValidationObject) {
    if (statefulObj.state === 'active') {
      const { isBlockingNavigation } = statefulObj;
      return isBlockingNavigation;
    }

    return false;
  }

  public getAll(): Array<ValidationResponse> {
    return this.applicableValidations.reduce((all, statefulObj) => {
      if (statefulObj.state === 'active' && statefulObj.response) {
        return [
          ...all,
          {
            ...statefulObj.response,
            blocking: this.checkIfBlocking(statefulObj),
          },
        ];
      }

      return all;
    }, [] as Array<ValidationResponse>);
  }

  public get(): ValidationResponse | undefined {
    const firstInvalid = this.applicableValidations.find((statefulObj) => {
      return statefulObj.state === 'active' && statefulObj.response;
    });

    if (firstInvalid?.state === 'active') {
      return {
        ...firstInvalid.response,
        blocking: this.checkIfBlocking(firstInvalid),
      };
    }
  }

  private runApplicableValidations(
    runner: ValidationRunner,
    canDismiss: boolean,
    phase: Validation.Trigger
  ) {
    // If the currentState is not load, skip those
    this.applicableValidations = this.applicableValidations.map(
      (originalValue) => {
        if (originalValue.state === 'dismissed') {
          // Don't rerun any dismissed warnings
          return originalValue;
        }

        // treat all warnings the same and block it once (unless blocking is true)
        const blocking =
          originalValue.value.blocking ??
          ((originalValue.value.severity === 'warning' && 'once') || true);

        const obj = setIn(
          originalValue,
          ['value', 'blocking'],
          blocking
        ) as StatefulValidationObject;

        const isBlockingNavigation =
          blocking === true || (blocking === 'once' && !canDismiss);

        if (
          phase === 'navigation' &&
          obj.state === 'active' &&
          obj.value.blocking !== true
        ) {
          if (obj.value.severity === 'warning') {
            const warn = obj as ActiveWarning;
            if (
              warn.dismissable &&
              warn.response.dismiss &&
              (warn.response.blocking !== 'once' || !warn.response.blocking)
            ) {
              warn.response.dismiss();
            } else {
              if (warn?.response.blocking === 'once') {
                warn.response.blocking = false;
              }

              warn.dismissable = true;
            }

            return warn as StatefulValidationObject;
          }
        }

        const response = runner(obj.value);

        const newState = {
          type: obj.type,
          value: obj.value,
          state: response ? 'active' : 'none',
          isBlockingNavigation,
          dismissable:
            obj.value.severity === 'warning' && phase === 'navigation',
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
      }
    );
  }

  public update(
    phase: Validation.Trigger,
    canDismiss: boolean,
    runner: ValidationRunner
  ) {
    const newApplicableValidations: StatefulValidationObject[] = [];

    if (phase === 'load' && this.currentPhase !== undefined) {
      // Tried to run the 'load' phase twice. Aborting
      return;
    }

    if (this.currentPhase === 'navigation' || phase === this.currentPhase) {
      // Already added all the types. No need to continue adding new validations
      this.runApplicableValidations(runner, canDismiss, phase);
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

      // if there is an non-blocking error that is active then remove the error from applicable validations so it can no longer be shown
      // which is needed if there are additional warnings to become active for that binding after the error is shown
      this.applicableValidations.forEach((element) => {
        if (
          !(
            element.type === 'error' &&
            element.state === 'active' &&
            element.isBlockingNavigation === false
          )
        ) {
          newApplicableValidations.push(element);
        }
      });

      this.applicableValidations = [
        ...newApplicableValidations,
        ...this.validationsByState.navigation,
        ...(this.currentPhase === 'load' ? this.validationsByState.change : []),
      ];
      this.currentPhase = 'navigation';
    }

    this.runApplicableValidations(runner, canDismiss, phase);
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

    resolveValidationProviders: new SyncWaterfallHook<
      [
        Array<{
          /** The name of the provider */
          source: string;
          /** The provider itself */
          provider: ValidationProvider;
        }>
      ],
      {
        /** The view this is triggered for  */
        view?: ViewInstance;
      }
    >(),

    /** A hook called when a binding is added to the tracker */
    onTrackBinding: new SyncHook<[BindingInstance]>(),
  };

  private tracker: BindingTracker | undefined;
  private validations = new Map<BindingInstance, ValidatedBinding>();
  private validatorRegistry?: ValidatorRegistry;
  private schema: SchemaController;

  private providers:
    | Array<{
        /** The name of the provider */
        source: string;
        /** The provider itself */
        provider: ValidationProvider;
      }>
    | undefined;

  private viewValidationProvider?: ValidationProvider;
  private options?: SimpleValidatorContext;
  private weakBindingTracker = new Set<BindingInstance>();

  constructor(schema: SchemaController, options?: SimpleValidatorContext) {
    this.schema = schema;
    this.options = options;
    this.reset();
  }

  setOptions(options: SimpleValidatorContext) {
    this.options = options;
  }

  /** Return the middleware for the data-model to stop propagation of invalid data */
  public getDataMiddleware(): Array<DataModelMiddleware> {
    return [
      {
        set: (transaction, options, next) => {
          return next?.set(transaction, options) ?? [];
        },
        get: (binding, options, next) => {
          return next?.get(binding, options);
        },
        delete: (binding, options, next) => {
          this.validations = removeBindingAndChildrenFromMap(
            this.validations,
            binding
          );

          return next?.delete(binding, options);
        },
      },
      new ValidationMiddleware(
        (binding) => {
          if (!this.options) {
            return;
          }

          this.updateValidationsForBinding(binding, 'change', this.options);
          const strongValidation = this.getValidationForBinding(binding);

          // return validation issues directly on bindings first
          if (strongValidation?.get()?.severity === 'error') {
            return strongValidation.get();
          }

          // if none, check to see any validations this binding may be a weak ref of and return
          const newInvalidBindings: Set<StrongOrWeakBinding> = new Set();
          this.validations.forEach((weakValidation, strongBinding) => {
            if (
              caresAboutDataChanges(
                new Set([binding]),
                weakValidation.weakBindings
              ) &&
              weakValidation?.get()?.severity === 'error'
            ) {
              weakValidation?.weakBindings.forEach((weakBinding) => {
                if (weakBinding === strongBinding) {
                  newInvalidBindings.add({
                    binding: weakBinding,
                    isStrong: true,
                  });
                } else {
                  newInvalidBindings.add({
                    binding: weakBinding,
                    isStrong: false,
                  });
                }
              });
            }
          });

          if (newInvalidBindings.size > 0) {
            return newInvalidBindings;
          }
        },
        { logger: new ProxyLogger(() => this.options?.logger) }
      ),
    ];
  }

  private getValidationProviders() {
    if (this.providers) {
      return this.providers;
    }

    this.providers = this.hooks.resolveValidationProviders.call([
      {
        source: SCHEMA_VALIDATION_PROVIDER_NAME,
        provider: this.schema,
      },
      {
        source: VIEW_VALIDATION_PROVIDER_NAME,
        provider: {
          getValidationsForBinding: (
            binding: BindingInstance
          ): Array<ValidationObject> | undefined => {
            return this.viewValidationProvider?.getValidationsForBinding?.(
              binding
            );
          },

          getValidationsForView: (): Array<ValidationObject> | undefined => {
            return this.viewValidationProvider?.getValidationsForView?.();
          },
        },
      },
    ]);

    return this.providers;
  }

  public reset() {
    this.validations.clear();
    this.tracker = undefined;
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
          if (
            !this.options ||
            this.getValidationForBinding(binding) !== undefined
          ) {
            return;
          }

          // Set the default value for the binding if we need to
          const originalValue = this.options.model.get(binding);
          const withoutDefault = this.options.model.get(binding, {
            ignoreDefaultValue: true,
          });

          if (originalValue !== withoutDefault) {
            // Don't trigger updates when setting the default value
            this.options.model.set([[binding, originalValue]], {
              silent: true,
            });
          }

          this.updateValidationsForBinding(
            binding,
            'load',
            this.options,
            () => {
              view.update(new Set([binding]));
            }
          );

          this.hooks.onTrackBinding.call(binding);
        },
      },
    });

    this.tracker = bindingTrackerPlugin;
    this.viewValidationProvider = view;

    bindingTrackerPlugin.apply(view);
  }

  updateValidationsForBinding(
    binding: BindingInstance,
    trigger: Validation.Trigger,
    validationContext?: SimpleValidatorContext,
    onDismiss?: () => void
  ): void {
    const context = validationContext ?? this.options;

    if (!context) {
      throw new Error(`Context is required for executing validations`);
    }

    if (trigger === 'load') {
      // Get all of the validations from each provider
      const possibleValidations = this.getValidationProviders().reduce<
        Array<ValidationObjectWithSource>
      >(
        (vals, provider) => [
          ...vals,
          ...(provider.provider
            .getValidationsForBinding?.(binding)
            ?.map((valObj) => ({
              ...valObj,
              [VALIDATION_PROVIDER_NAME_SYMBOL]: provider.source,
            })) ?? []),
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
      const response = this.validationRunner(validationObj, binding, context);

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
              vBinding,
              context
            );
            return response ? { message: response.message } : undefined;
          });
        }
      });
    }
  }

  validationRunner(
    validationObj: ValidationObjectWithHandler,
    binding: BindingInstance,
    context: SimpleValidatorContext | undefined = this.options
  ) {
    if (!context) {
      throw new Error('No context provided to validation runner');
    }

    const handler =
      validationObj.handler ?? this.getValidator(validationObj.type);

    const weakBindings = new Set<BindingInstance>();

    // For any data-gets in the validation runner, default to using the _invalid_ value (since that's what we're testing against)
    const model: DataModelWithParser = {
      get(b, options) {
        weakBindings.add(isBinding(b) ? binding : context.parseBinding(b));
        return context.model.get(b, { ...options, includeInvalid: true });
      },
      set: context.model.set,
      delete: context.model.delete,
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
        schemaType: this.schema.getType(binding),
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
    const isNavigationTrigger = trigger === 'navigation';
    const lastActiveBindings = this.activeBindings;

    /** Run validations for all bindings in view */
    const updateValidations = (dismissValidations: boolean) => {
      this.getBindings().forEach((binding) => {
        this.validations
          .get(binding)
          ?.update(trigger, dismissValidations, (obj) => {
            if (!this.options) {
              return;
            }

            return this.validationRunner(obj, binding, this.options);
          });
      });
    };

    // Should dismiss for non-navigation triggers.
    updateValidations(!isNavigationTrigger);

    if (isNavigationTrigger) {
      // If validations didn't change since last update, dismiss all dismissible validations.
      const { activeBindings } = this;
      if (isSubset(activeBindings, lastActiveBindings)) {
        updateValidations(true);
      }
    }
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

  trackBinding(binding: BindingInstance): void {
    this.tracker?.trackBinding(binding);
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

    let canTransition = true;

    this.getBindings().forEach((b) => {
      const allValidations = this.getValidationForBinding(b)?.getAll();

      allValidations?.forEach((v) => {
        if (trigger === 'navigation' && v.blocking) {
          this.options?.logger.debug(
            `Validation on binding: ${b.asString()} is preventing navigation. ${JSON.stringify(
              v
            )}`
          );

          canTransition = false;
        }

        if (!validations.has(b)) {
          validations.set(b, v);
        }
      });
    });

    return {
      canTransition,
      validations: validations.size ? validations : undefined,
    };
  }

  /** Get the current tracked validation for the given binding */
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
        );
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
      getValidationsForBinding() {
        throw new Error('Error rollup should be provided by the view plugin');
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
          'Section functionality should be provided by the view plugin'
        );
      },
      type: (binding) =>
        this.schema.getType(isBinding(binding) ? binding : parser(binding)),
    };
  }
}
