import type { PropsWithChildren } from 'react';
import React from 'react';
import type { ArrayNode, JsonNode, ObjectNode } from 'react-json-reconciler';
import { flattenNodes, PropertyNode } from 'react-json-reconciler';
import { SlotContext } from '.';
import { IDSuffixProvider, OptionalIDSuffixProvider } from './auto-id';
import type {
  BindingTemplateInstance,
  ExpressionTemplateInstance,
} from './string-templates';
import { isTemplateStringInstance } from './string-templates';
import { normalizeToCollection, toJsonProperties } from './utils';

export interface SwitchProps {
  /** defaults to a staticSwitch */
  isDynamic?: boolean;
}

const SwitchContext = React.createContext<
  SwitchProps & {
    /** A text component if we hit a string but expect an asset */
    TextComp?: React.ComponentType;

    /** A component to create a collection asset is we get an array but need a single element */
    CollectionComp?: React.ComponentType;
  }
>({});

/**
 * Switches allow users to fork content between 1 or more assets
 */
export const Switch = (props: PropsWithChildren<SwitchProps>) => {
  const slotContext = React.useContext(SlotContext);
  const propertyNode = React.useRef<ObjectNode>(null);

  return (
    <obj ref={propertyNode}>
      <SwitchContext.Provider
        value={{
          ...props,
          TextComp: slotContext?.TextComp,
          CollectionComp: slotContext?.CollectionComp,
        }}
      >
        <OptionalIDSuffixProvider wrapperRef={propertyNode}>
          <property name={props.isDynamic ? 'dynamicSwitch' : 'staticSwitch'}>
            <SlotContext.Provider value={undefined}>
              <array>{props.children}</array>
            </SlotContext.Provider>
          </property>
        </OptionalIDSuffixProvider>
      </SwitchContext.Provider>
      {slotContext?.additionalProperties &&
        toJsonProperties(slotContext.additionalProperties)}
    </obj>
  );
};

export interface CaseProps {
  /** the test for this case statement */
  exp?: ExpressionTemplateInstance | BindingTemplateInstance | boolean;
}

/** Find the first parent array */
const findParentArray = (node: JsonNode): ArrayNode => {
  if (node.type === 'array') {
    return node;
  }

  if (node.parent) {
    return findParentArray(node.parent);
  }

  throw new Error("can't find parent array");
};

/** Find the index of the item in an array */
const findArrayIndex = (node: JsonNode): number => {
  const parentArray = findParentArray(node);
  const allSearch = flattenNodes(parentArray.children);
  return allSearch.indexOf(node);
};

/** A case for a switch */
const Case = (props: PropsWithChildren<CaseProps>) => {
  const slotContext = React.useContext(SlotContext);
  const switchContext = React.useContext(SwitchContext);
  const [caseIndex, setCaseIndex] = React.useState(-1);
  const caseNode = React.useRef<ObjectNode>(null);

  React.useLayoutEffect(() => {
    if (caseNode.current) {
      const index = findArrayIndex(caseNode.current);
      if (index !== caseIndex) {
        setCaseIndex(index);
      }
    }
  }, [caseIndex]);

  let expValue: string | boolean = true;

  if (props.exp !== undefined) {
    expValue = isTemplateStringInstance(props.exp)
      ? props.exp.toValue()
      : props.exp;
  }

  return (
    <obj ref={caseNode}>
      <property name="case">
        <value value={expValue} />
      </property>
      <IDSuffixProvider
        suffix={`${
          switchContext.isDynamic ? 'dynamicSwitch' : 'staticSwitch'
        }-${caseIndex}`}
      >
        <SlotContext.Provider
          value={
            slotContext ? { ...slotContext, wrapInAsset: false } : undefined
          }
        >
          <property name="asset">
            {normalizeToCollection({
              node: props.children,
              TextComp: switchContext?.TextComp,
              CollectionComp: switchContext?.CollectionComp,
            })}
          </property>
        </SlotContext.Provider>
      </IDSuffixProvider>
    </obj>
  );
};

Switch.Case = Case;
