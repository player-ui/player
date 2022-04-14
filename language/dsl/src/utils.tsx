import React from 'react';
import {
  isTemplateStringInstance,
  TemplateStringComponent,
} from './string-templates';

/** Get an array version of the value */
export function toArray<T>(val: T | Array<T>): Array<T> {
  return Array.isArray(val) ? val : [val];
}

/** Create a component version  */
export function toJsonElement(value: any, index?: number): React.ReactElement {
  const keyProp = index === undefined ? null : { key: index };

  if (Array.isArray(value)) {
    return (
      <array {...keyProp}>
        {value.map((item, idx) => toJsonElement(item, idx))}
      </array>
    );
  }

  /** Allow users to pass in BindingTemplateInstance and ExpressionTemplateInstance directly without turning them into strings first */
  if (isTemplateStringInstance(value)) {
    return <value {...keyProp}>{value.toRefString()}</value>;
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <obj {...keyProp}>
        {Object.keys(value).map((key) => (
          <property key={key} name={key}>
            {toJsonElement(value[key])}
          </property>
        ))}
      </obj>
    );
  }

  return <value {...keyProp} value={value} />;
}

/** Create a fragment for the properties */
export function toJsonProperties(value: Record<string, any>) {
  return Object.keys(value).map((key) => (
    <property key={key} name={key}>
      {toJsonElement(value[key])}
    </property>
  ));
}

/** Create a text asset if needed */
export function normalizeText(options: {
  /** The current node */
  node: React.ReactNode;

  /** A component to render a text asset */
  TextComp?: React.ComponentType;
}): React.ReactNode {
  const { node, TextComp } = options;

  const nodeArr = React.Children.toArray(node);

  if (
    nodeArr.every(
      (n) => React.isValidElement(n) && n.type !== TemplateStringComponent
    )
  ) {
    return node;
  }

  if (TextComp) {
    return <TextComp>{nodeArr}</TextComp>;
  }

  throw new Error(
    `Tried to convert node to Text Asset, but no Component was supplied.`
  );
}

/** Create a collection if needed */
export function normalizeToCollection(options: {
  /** the node to look at */
  node: React.ReactNode;

  /** A Text asset */
  TextComp?: React.ComponentType;

  /** A collection asset */
  CollectionComp?: React.ComponentType;
}) {
  const { node, CollectionComp } = options;

  if (
    React.Children.count(node) > 1 &&
    React.Children.toArray(node).every((n) => typeof n !== 'string')
  ) {
    if (!CollectionComp) {
      throw new Error(
        `Tried to convert array to a collection asset, but no Component was given.`
      );
    }

    return <CollectionComp>{node}</CollectionComp>;
  }

  return normalizeText({ ...options, node });
}
