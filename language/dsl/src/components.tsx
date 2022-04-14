import React from 'react';
import flattenChildren from 'react-flatten-children';
import type { ObjectNode, PropertyNode } from 'react-json-reconciler';
import mergeRefs from 'react-merge-refs';
import type { PlayerApplicability, WithChildren } from './types';
import {
  IDProvider,
  IDSuffixProvider,
  IndexSuffixStopContext,
  OptionalIDSuffixProvider,
  useGetIdPrefix,
} from './auto-id';
import {
  normalizeText,
  normalizeToCollection,
  toJsonProperties,
} from './utils';

export const SlotContext = React.createContext<
  | {
      /** The property name for the slot */
      propertyName: string;
      /** If the slot represents an array */
      isArray: boolean;
      /** If the items in the slot should be wrapped in an "asset" object */
      wrapInAsset: boolean;
      /** Other props to add to the slot */
      additionalProperties?: any;
      /** The ref to the property node */
      ref: React.RefObject<PropertyNode>;
      /** A text component if we hit a string but expect an asset */
      TextComp?: React.ComponentType;
      /** A component to create a collection asset is we get an array but need a single element */
      CollectionComp?: React.ComponentType;
    }
  | undefined
>(undefined);

/**
 * Wraps the children in an `asset` object.
 * Additional props are added to the top level object
 */
export const AssetWrapper = React.forwardRef<
  ObjectNode,
  WithChildren<{ [key: string]: any }>
>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <obj ref={ref}>
      {toJsonProperties(rest)}
      <property name="asset">{children}</property>
    </obj>
  );
});

/** Create a ID property for a node */
export const GeneratedIDProperty = (props: {
  /** the id to use if supplied by the user */
  id?: string;
}) => {
  const currentPrefixId = useGetIdPrefix();
  return <property name="id">{props.id ?? currentPrefixId}</property>;
};

/** An asset */
export const Asset = React.forwardRef<
  ObjectNode,
  {
    /** id of the asset */
    id?: string;

    /** the asset type */
    type: string;

    /** Any other properties on the asset */
    children?: React.ReactNode;

    /** other things that we don't know about */
    [key: string]: unknown;
  } & PlayerApplicability
>((props, ref) => {
  const { id, type, applicability, children, ...rest } = props;
  const slotContext = React.useContext(SlotContext);
  const localRef = React.useRef<ObjectNode>(null);
  const Wrapper = slotContext?.wrapInAsset ? AssetWrapper : React.Fragment;

  return (
    <Wrapper
      ref={slotContext?.wrapInAsset ? mergeRefs([ref, localRef]) : undefined}
      {...(slotContext?.wrapInAsset && slotContext?.additionalProperties
        ? slotContext?.additionalProperties
        : {})}
    >
      <OptionalIDSuffixProvider wrapperRef={localRef}>
        <SlotContext.Provider value={undefined}>
          <IDProvider id={id}>
            <obj
              ref={
                slotContext?.wrapInAsset
                  ? undefined
                  : mergeRefs([ref, localRef])
              }
            >
              <GeneratedIDProperty id={id} />
              <property name="type">{type}</property>
              {applicability !== undefined && (
                <property name="applicability">
                  <value
                    value={
                      typeof applicability === 'boolean'
                        ? applicability
                        : applicability.toRefString()
                    }
                  />
                </property>
              )}
              {toJsonProperties(rest)}
              {children}
            </obj>
          </IDProvider>
        </SlotContext.Provider>
      </OptionalIDSuffixProvider>
    </Wrapper>
  );
});

Asset.defaultProps = {
  id: undefined,
  children: undefined,
};

/** A component to generate a named property slot */
export const Slot = (props: {
  /** The name of the slot */
  name: string;

  /** if the slot is an array or single object */
  isArray?: boolean;

  /** if each item should be wrapped in an asset */
  wrapInAsset?: boolean;

  /** Any children to render in the slot */
  children?: React.ReactNode;

  /** Other properties to add to the slot */
  additionalProperties?: any;

  /** A text component if we hit a string but expect an asset */
  TextComp?: React.ComponentType;

  /** A component to create a collection asset is we get an array but need a single element */
  CollectionComp?: React.ComponentType;
}) => {
  const { TextComp, CollectionComp } = props;
  const children = flattenChildren(props.children);
  const propRef = React.useRef<PropertyNode>(null);

  return (
    <property ref={propRef} name={props.name}>
      <IDSuffixProvider suffix={props.name}>
        <IndexSuffixStopContext.Provider value={false}>
          <SlotContext.Provider
            value={{
              ref: propRef,
              propertyName: props.name,
              wrapInAsset: props.wrapInAsset ?? false,
              isArray: props.isArray ?? false,
              additionalProperties: props.additionalProperties,
              TextComp,
              CollectionComp,
            }}
          >
            {props.isArray && (
              <array>
                {React.Children.map(children, (child, index) => {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={`${props.name}-${index}`}>
                      {normalizeText({ node: child, TextComp })}
                    </React.Fragment>
                  );
                })}
              </array>
            )}

            {!props.isArray &&
              normalizeToCollection({
                node: children,
                TextComp,
                CollectionComp,
              })}
          </SlotContext.Provider>
        </IndexSuffixStopContext.Provider>
      </IDSuffixProvider>
    </property>
  );
};

/** Create a slot for a given property */
export function createSlot<SlotProps = unknown>(options: {
  /** The name of the slot */
  name: string;

  /** if the slot is an array or single object */
  isArray?: boolean;

  /** if each item should be wrapped in an asset */
  wrapInAsset?: boolean;

  /** Any children to render in the slot */
  children?: React.ReactNode;

  /** A text component if we hit a string but expect an asset */
  TextComp?: React.ComponentType;

  /** A component to create a collection asset is we get an array but need a single element */
  CollectionComp?: React.ComponentType;
}) {
  return (
    props: {
      /** An object to include in this property */
      children?: React.ReactNode;
    } & SlotProps
  ) => {
    const { children, ...other } = props;
    return (
      <Slot {...options} additionalProperties={other}>
        {children}
      </Slot>
    );
  };
}
