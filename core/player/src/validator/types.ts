import type { Validation } from '@player-ui/types';

import type { BindingInstance, BindingFactory } from '../binding';
import type { DataModelWithParser } from '../data';
import type { ExpressionEvaluatorFunction } from '../expressions';
import type { Logger } from '../logger';
import type { ConstantsProvider } from '../controllers';

interface BaseValidationResponse<T = Validation.Severity> {
  /** The validation message to show to the user */
  message: string;

  /** List of parameters associated with a validation. These can be replaced into a templatized message string. */
  parameters?: Record<string, any>;

  /** How serious is this violation */
  severity: T;

  /** Where this validation should be displayed */
  displayTarget?: Validation.DisplayTarget;

  /** The blocking state of this validation */
  blocking?: boolean | 'once';
}

export interface WarningValidationResponse
  extends BaseValidationResponse<'warning'> {
  /** Warning validations can be dismissed without correcting the error */
  dismiss?: () => void;
}

export type ErrorValidationResponse = BaseValidationResponse<'error'>;

export type ValidationResponse =
  | ErrorValidationResponse
  | WarningValidationResponse;

type RequiredValidationKeys = 'severity' | 'trigger';

export type ValidationObject = Validation.Reference &
  Required<Pick<Validation.Reference, RequiredValidationKeys>>;

export interface ValidationProvider {
  getValidationsForBinding?(
    binding: BindingInstance
  ): Array<ValidationObject> | undefined;

  getValidationsForView?(): Array<ValidationObject> | undefined;
}

export interface ValidatorContext {
  /** The data to set or get data from */
  model: DataModelWithParser;

  /** A means of parsing a binding */
  parseBinding: BindingFactory;

  /** Execute the expression and return it's result */
  evaluate: ExpressionEvaluatorFunction;

  /** Logger instance to use */
  logger: Logger;

  /** The validation object that triggered this function */
  validation: ValidationObject;

  /** The constants for messages */
  constants: ConstantsProvider;
}

export type ValidatorFunction<Options = unknown> = (
  context: ValidatorContext,
  value: any,
  options?: Options
) => Omit<BaseValidationResponse, 'severity'> | undefined;
