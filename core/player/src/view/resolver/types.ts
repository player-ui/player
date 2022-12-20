import type {
  Schema,
  Formatting,
  Validation as ValidationTypes,
} from '@player-ui/types';
import type {
  BindingInstance,
  BindingLike,
  BindingFactory,
} from '../../binding';
import type {
  DataModelWithParser,
  DataModelImpl,
  DataModelOptions,
} from '../../data';
import type { TransitionFunction } from '../../controllers';
import type { ExpressionEvaluator, ExpressionType } from '../../expressions';
import type { ValidationResponse } from '../../validator';
import type { Logger } from '../../logger';
import type { SchemaController } from '../../schema';
import type { Node } from '../parser';

export declare namespace Resolve {
  export interface Validation {
    /** Fetch the data-type for the given binding */
    type(binding: BindingLike): Schema.DataType | undefined;

    /** Get all currently applicable validation errors */
    getAll(): Map<BindingInstance, ValidationResponse> | undefined;

    /** Internal Method to lookup if there is a validation for the given binding */
    _getValidationForBinding(
      binding: BindingLike
    ): ValidationResponse | undefined;

    /** Get field level error for the specific binding */
    get(
      binding: BindingLike,
      options?: {
        /** If this binding should also be tracked for validations */
        track: boolean;
      }
    ): ValidationResponse | undefined;

    /** Get errors for all children regardless of section */
    getChildren(type: ValidationTypes.DisplayTarget): Array<ValidationResponse>;

    /** Get errors for all children solely in this section */
    getValidationsForSection(): Array<ValidationResponse>;

    /** Track errors for this binding, and notify the node of changes */
    track: (binding: BindingLike) => void;

    /** Register node as a section */
    register: (options?: {
      /** While type of Display Target group it should register as */
      type: Exclude<ValidationTypes.DisplayTarget, 'field'>;
    }) => void;
  }

  export interface BaseOptions {
    /** A logger to use */
    logger?: Logger;

    /** An optional set of validation features */
    validation?: Validation;

    /** Parse a raw valy into an AST node */
    parseNode?: (node: any) => Node.Node | null;

    /** A function to move the state to a new place */
    transition?: TransitionFunction;

    /** The hub for data invariants and metaData associated with the data model */
    schema: SchemaController;
  }

  export interface NodeDataOptions {
    /** The data to set or get data from */
    model: DataModelWithParser<DataModelOptions>;

    /**
     * A function to format a given a value (given a binding) for display to the user
     * Note: this doesn't persist any changes in the model.
     */
    format: (binding: BindingLike, value: any) => any;

    /**
     * A function to format a given value using a formatting reference.
     * The default behavior is the identity function.
     */
    formatValue: (formatReference: Formatting.Reference, value: any) => any;
  }

  export type NodeResolveOptions = BaseOptions & {
    /** Execute the expression and return it's result */
    evaluate: (exp: ExpressionType) => any;

    /** All parameters for how to process data */
    data: NodeDataOptions;

    /** The data dependencies that were requested during the resolution */
    getDependencies?(scope?: 'core' | 'children'): Set<BindingInstance>;

    /** original node */
    node?: Node.Node;
  };

  export type ResolverOptions = BaseOptions & {
    /** The data model to set or get data from */
    model: DataModelImpl<DataModelOptions>;

    /** A formatter function to call */
    format?: (binding: BindingInstance, value: any) => any;

    /**
     * A function to format a given value using a formatting reference.
     * The default behavior is the identity function.
     */
    formatValue?: (formatReference: Formatting.Reference, value: any) => any;

    /** An evaluator to execute an expression */
    evaluator: ExpressionEvaluator;

    /** A fn to parse a raw binding into a binding object */
    parseBinding: BindingFactory;
  };

  export interface ResolvedNode {
    /** The original node */
    node: Node.Node;

    /** The data dependencies that were requested during the resolution */
    dependencies: Set<BindingInstance>;

    /** The final value */
    value: any;
  }

  export type NodeTransformFunction = (
    node: Node.Node,
    options: NodeResolveOptions
  ) => Node.Node | null;

  export type NodeResolveFunction = (
    value: any,
    node: Node.Node,
    options: NodeResolveOptions
  ) => any;

  export interface Plugin {
    /** A transform function to migrate an AST to another AST */
    beforeResolve?: NodeTransformFunction;

    /** A function to transform an AST to a resolved value */
    resolve?: NodeResolveFunction;

    /** A function to process a resolved value before completing the node */
    afterResolve?: NodeResolveFunction;
  }
}
