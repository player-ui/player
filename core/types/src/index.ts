/**
 * An asset is the smallest unit of user interaction in a player view
 */
export interface Asset<T extends string = string> {
  /** Each asset requires a unique id per view */
  id: string;

  /** The asset type determines the semantics of how a user interacts with a page */
  type: T;

  [key: string]: unknown;
}
/**
 * An asset that contains a Binding.
 */
export interface AssetBinding extends Asset {
  /** A binding that points to somewhere in the data model */
  binding: Binding;
}

/** A single case statement to use in a switch */
export interface SwitchCase<T extends Asset = Asset> {
  /** The Asset to use if this case is applicable */
  asset: T;

  /** An expression to execute to determine if this case applies */
  case: Expression | true;
}

/** A switch can replace an asset with the applicable case on first render */
export type Switch<T extends Asset = Asset> = SwitchCase<T>[];

/** An object that contains an asset */
export type AssetWrapper<T extends Asset = Asset> = {
  /** An asset instance */
  asset: T;

  [key: string]: unknown;
};

export type AssetWrapperOrSwitch<T extends Asset = Asset> =
  | (AssetWrapper<T> & {
      /** The dynamicSwitch property can't exist at the same time as 'asset' */
      dynamicSwitch?: never;

      /** The staticSwitch property can't exist at the same time as 'asset' */
      staticSwitch?: never;
    })
  | (StaticSwitch<T> & {
      /** The staticSwitch property can't exist at the same time as 'asset' */
      asset?: never;

      /** The staticSwitch property can't exist at the same time as 'dynamicSwitch' */
      dynamicSwitch?: never;
    })
  | (DynamicSwitch<T> & {
      /** The dynamicSwitch property can't exist at the same time as 'asset' */
      asset?: never;

      /** The dynamicSwitch property can't exist at the same time as 'staticSwitch' */
      staticSwitch?: never;
    });

export type AssetSwitch<T extends Asset = Asset> =
  | StaticSwitch<T>
  | DynamicSwitch<T>;

export interface StaticSwitch<T extends Asset = Asset> {
  /** A static switch only evaluates the applicable base on first render of the view */
  staticSwitch: Switch<T>;
}

export interface DynamicSwitch<T extends Asset = Asset> {
  /** A dynamic switch re-evaluates the applicable case as data changes */
  dynamicSwitch: Switch<T>;
}

/**
 * Expressions are a specialized way of executing code.
 * If the expression is a composite, the last expression executed is the return value
 */
export type Expression = string | string[];
export type ExpressionRef = `@[${string}]@`;

/**
 * Bindings describe locations in the data model.
 */
export type Binding = string;
export type BindingRef = `{{${Binding}}}`;

/**
 * The data-model is the location that all user data is stored
 */
export type DataModel = Record<any, unknown>;

/** The navigation section of the flow describes a State Machine for the user. */
export type Navigation = {
  /** The name of the Flow to begin on */
  BEGIN: string;
} & Record<string, string | NavigationFlow>;

/** An object with an expression in it */
export interface ExpressionObject {
  /** The expression to run */
  exp?: Expression;
}

/** A state machine in the navigation */
export interface NavigationFlow {
  /** The first state to kick off the state machine */
  startState: string;

  /** An optional expression to run when this Flow starts */
  onStart?: Expression | ExpressionObject;

  /** An optional expression to run when this Flow ends */
  onEnd?: Expression | ExpressionObject;

  [key: string]:
    | undefined
    | string
    | Expression
    | ExpressionObject
    | NavigationFlowState;
}

export type NavigationFlowTransition = Record<string, string>;

interface CommentBase {
  /** Add comments that will not be processing, but are useful for code explanation */
  _comment?: string;
}

/** The base representation of a state within a Flow */
export interface NavigationBaseState<T extends string> extends CommentBase {
  /** A property to determine the type of state this is */
  state_type: T;

  /** An optional expression to run when this view renders */
  onStart?: Expression | ExpressionObject;

  /** An optional expression to run before view transition */
  onEnd?: Expression | ExpressionObject;

  /**
   * TS gets really confused with both the ActionState and the onStart state both declaring the `exp` property
   * So this explicity says there should never be an exp prop on a state node that's not of type 'ACTION'
   */
  exp?: T extends 'ACTION' ? Expression : never;
}

/** A generic state that can transition to another state */
export interface NavigationFlowTransitionableState<T extends string>
  extends NavigationBaseState<T> {
  /** A mapping of transition-name to FlowState name */
  transitions: NavigationFlowTransition;
}

/** A state representing a view  */
export interface NavigationFlowViewState
  extends NavigationFlowTransitionableState<'VIEW'> {
  /** An id corresponding to a view from the 'views' array */
  ref: string;

  /** View meta-properties */
  attributes?: {
    [key: string]: any;
  };

  /** Any additional properties are forwarded as options, like param */
  [key: string]: unknown;
}

/**
 * An END state of the flow.
 */
export interface NavigationFlowEndState extends NavigationBaseState<'END'> {
  /**
   * A description of _how_ the flow ended.
   * If this is a flow started from another flow, the outcome determines the flow transition
   */
  outcome: string;

  /** Any additional properties are forwarded as options, like param */
  [key: string]: unknown;
}

/** Action states execute an expression to determine the next state to transition to */
export interface NavigationFlowActionState
  extends NavigationFlowTransitionableState<'ACTION'> {
  /**
   * An expression to execute.
   * The return value determines the transition to take
   */
  exp: Expression;
}

/**
 * External Flow states represent states in the FSM that can't be resolved internally in Player.
 * The flow will wait for the embedded application to manage moving to the next state via a transition
 */
export interface NavigationFlowExternalState
  extends NavigationFlowTransitionableState<'EXTERNAL'> {
  /** A reference for this external state */
  ref: string;
  /** Any additional properties are forwarded as options */
  [key: string]: unknown;
}

export interface NavigationFlowFlowState
  extends NavigationFlowTransitionableState<'FLOW'> {
  /** A reference to a FLOW id state to run */
  ref: string;
}

export type NavigationFlowState =
  | NavigationFlowViewState
  | NavigationFlowEndState
  | NavigationFlowFlowState
  | NavigationFlowActionState
  | NavigationFlowExternalState;

/** The data at the end of a flow */
export interface FlowResult {
  /** The outcome describes _how_ the flow ended (forwards, backwards, etc) */
  endState: NavigationFlowEndState;

  /** The serialized data-model */
  data?: any;
}

/** Any object that contains 1 or more templates */
export interface Templatable {
  /** A list of templates to process for this node */
  template?: Template[];
}

/** A template describes a mapping from a data array -> array of objects */
export interface Template<ValueType = unknown, Key extends string = string> {
  /** A pointer to the data-model containing an array of elements to map over */
  data: Binding;

  /**
   * The template to iterate over using each value in the supplied template data.
   * Any reference to _index_ is replaced with the current iteration index.
   */
  value: ValueType;

  /** should the template be recomputed when data changes */
  dynamic?: boolean;

  /**
   * A property on the parent object to store the new map under.
   * If it already exists, values are appended to the end.
   */
  output: Key;
}

/**
 * The Schema organizes all content related to Data and it's types
 */
export declare namespace Schema {
  /** The authored schema object in the JSON payload */
  export interface Schema {
    /** The ROOT object is the top level object to use */
    ROOT: Node;

    /** Any additional keys are properties of the ROOT object */
    [key: string]: Node;
  }

  /** A Node describes a specific object in the tree */
  export interface Node {
    /** Each property describes a property of the object */
    [key: string]: DataType;
  }

  /** Each prop in the object can have a specific DataType */
  export interface DataType<T = unknown> {
    /** The reference of the base type to use */
    type: string;

    /** The referenced object represents an array rather than an object */
    isArray?: boolean;

    /**
     * Any additional validations that are associated with this property
     * These will add to any base validations associated with the "type"
     */
    validation?: Validation.Reference[];

    /**
     * A reference to a specific data format to use.
     * If none is specified, will fallback to that of the base type
     */
    format?: Formatting.Reference;

    /**
     * A default value for this property.
     * Any reads for this property will result in this default value being written to the model.
     */
    default?: T;

    /** Any additional options */
    [key: string]: unknown;
  }
}

/** Namespace to wrap up core functionality to be used by the Language Service */
export declare namespace Language {
  /**
   * Helper to compliment `Schema.DataType` to provide a way to export a reference to a data type instead of the whole object
   */
  export interface DataTypeRef {
    /** Name of the type in Player Core */
    type: string;
  }
}

/** A spot for formatting */
export declare namespace Formatting {
  /** A reference to a specific formatter */
  export interface Reference {
    /** The name of the formatter (and de-formatter) to use */
    type: string;

    /** Any additional properties will be passed as options to the formatter function */
    [key: string]: unknown;
  }
}

/** A space for all thing validation */
export declare namespace Validation {
  /**
   * How serious are you about this error?
   * Warning validations are reserved for errors that could be ignored by the user without consequence
   * Errors must be fixed before proceeding
   */
  export type Severity = 'error' | 'warning';

  /**
   * When to _first_ start caring about a validation of a data-val.
   *
   * load - only check once the first time the binding appears on screen
   * change - check anytime the data changes
   * navigation - check once the user attempts to navigate away from a view
   */
  export type Trigger = 'navigation' | 'change' | 'load';

  /**
   * Where the error/warning should be displayed.
   * - `field` is the default display target. This renders the error/warning directly underneath the field.
   * - `section` is used to display a message at a parent node that is designated as a "section"
   * - `page` a special section used to display a message at the top of the page.
   */
  export type DisplayTarget = 'page' | 'section' | 'field';

  /** A reference to a validation object */
  export interface Reference {
    /**
     * The name of the referenced validation type
     * This will be used to lookup the proper handler
     */
    type: string;

    /** An optional means of overriding the default message if the validation is triggered */
    message?: string;

    /** An optional means of overriding the default severity of the validation if triggered */
    severity?: Severity;

    /** When to run this particular validation */
    trigger?: Trigger;

    /**
     * Each validation is passed the value of the data to run it's validation against.
     * By default, this is the value stored in the data-model (deformatted).
     * In the off chance you'd like this validator to run against the formatted value (the one the user sees), set this option
     */
    dataTarget?: 'formatted' | 'deformatted';

    /** Where the error should be displayed */
    displayTarget?: DisplayTarget;

    /** Additional props to send down to a Validator */
    [key: string]: unknown;
  }

  export interface CrossfieldReference extends Reference {
    /** The binding to associate this validation with */
    ref?: Binding;

    /** Cross-field references and validation must run against the default (deformatted) value */
    dataTarget?: never;
  }
}

export type View<T extends Asset = Asset> = unknown extends T['validation']
  ? T & {
      /** Each view can optionally supply a list of validations to run against a particular view */
      validation?: Array<Validation.CrossfieldReference>;
    }
  : T;

/**
 * The JSON payload for running Player
 */
export interface Flow<T extends Asset = Asset> {
  /** A unique identifier for the flow  */
  id: string;

  /** A list of views (each with an ID) that can be shown to a user */
  views?: Array<View<T>>;

  /**
   * The schema for the supplied (or referenced data).
   * This is used for validation, formatting, etc
   */
  schema?: Schema.Schema;

  /** Any initial data that the flow can use */
  data?: DataModel;

  /** A state machine to drive a user through the experience */
  navigation: Navigation;

  /** Other keys can be present. We just don't know what they are */
  [key: string]: unknown;
}
