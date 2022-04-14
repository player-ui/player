import React from 'react';

export type TemplateInstanceRefStringContext = 'binding' | 'expression';
export interface TemplateRefStringOptions {
  /** If this template string is inside of another binding or expression */
  nestedContext?: TemplateInstanceRefStringContext;
}
export interface TemplateInstanceRefStringOptions {
  /** The array of strings for the template */
  strings: TemplateStringsArray;
  /** the other data that's present in the template */
  other: Array<string | TemplateStringType>;

  /** If this template string is inside of another binding or expression */
  nestedContext?: TemplateInstanceRefStringContext;

  /** Convert the value to a reference nested in the given context */
  toRefString: (
    options: TemplateRefStringOptions | undefined,
    value: string
  ) => string;
}

const OpaqueIdentifier = Symbol('TemplateStringType');

export type TemplateStringType = React.ReactElement & {
  /** An identifier to show that this is a template type */
  [OpaqueIdentifier]: true;
  /** The value of the template string when in another string */
  toString: () => string;
  /** the raw value of the template string */
  toValue: () => string;
  /** the dereferenced value when used in another */
  toRefString: (options?: TemplateRefStringOptions) => string;
};

export type BindingTemplateInstance = TemplateStringType & {
  /** An identifier for a binding instance */
  __type: 'binding';
};

export type ExpressionTemplateInstance = TemplateStringType & {
  /** The identifier for an expression instance */
  __type: 'expression';
};

/** A react component for rendering a template string type */
export const TemplateStringComponent = (props: {
  /** The string value of the child template string */
  value: string;
}) => {
  return React.createElement(
    'value',
    {
      value: props.value,
    },
    null
  );
};

/** The generic template string handler */
const createTemplateInstance = (
  options: TemplateInstanceRefStringOptions
): TemplateStringType => {
  const value = options.strings.reduce((sum, next, i) => {
    const element = options.other[i];
    if (typeof element === 'string') {
      return sum + next + element;
    }

    return sum + next + (element?.toRefString(options) ?? '');
  }, '');

  /** get the unwrapped version */
  const toString = () => {
    return options.toRefString({}, value);
  };

  /** get the raw value of the template */
  const toValue = () => {
    return value;
  };

  /** This lets us use it directly as a child element in React */
  const element = React.createElement(
    TemplateStringComponent,
    {
      value: toString(),
    },
    null
  ) as TemplateStringType;

  return {
    ...element,
    [OpaqueIdentifier]: true,
    toString,
    toValue,
    toRefString: (refStringOptions?: TemplateRefStringOptions) => {
      return options.toRefString(refStringOptions, value);
    },
  };
};

/** Creating an instance of a handler for bindings */
const createBindingTemplateInstance = (
  options: Omit<TemplateInstanceRefStringOptions, 'toRefString'>
): BindingTemplateInstance => {
  const templateInstance = createTemplateInstance({
    ...options,
    toRefString: (context, value) => {
      return `{{${value}}}`;
    },
  }) as BindingTemplateInstance;

  templateInstance.__type = 'binding';

  return templateInstance;
};

/** Creating an instance of a handler for bindings */
const createExpressionTemplateInstance = (
  options: Omit<TemplateInstanceRefStringOptions, 'toRefString'>
) => {
  const templateInstance = createTemplateInstance({
    ...options,
    toRefString: (contextOptions, value) => {
      if (contextOptions?.nestedContext === 'expression') {
        return value;
      }

      const inBinding = contextOptions?.nestedContext === 'binding';
      return `${inBinding ? '`' : '@['}${value}${inBinding ? '`' : ']@'}`;
    },
  }) as ExpressionTemplateInstance;

  templateInstance.__type = 'expression';

  return templateInstance;
};

/** A tagged-template constructor for a binding  */
export const binding = (
  strings: TemplateStringsArray,
  ...nested: Array<TemplateStringType | string>
): BindingTemplateInstance => {
  return createBindingTemplateInstance({
    strings,
    other: nested,
    nestedContext: 'binding',
  });
};

/** A tagged-template constructor for an expression */
export const expression = (
  strings: TemplateStringsArray,
  ...nested: Array<
    ExpressionTemplateInstance | BindingTemplateInstance | string
  >
): ExpressionTemplateInstance => {
  return createExpressionTemplateInstance({
    strings,
    other: nested,
    nestedContext: 'expression',
  });
};

/** Check if a value is a template string */
export const isTemplateStringInstance = (
  val: unknown
): val is ExpressionTemplateInstance | BindingTemplateInstance => {
  return typeof val === 'object' && (val as any)[OpaqueIdentifier] === true;
};
