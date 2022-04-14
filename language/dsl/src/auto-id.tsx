import React from 'react';
import type { JsonNode } from 'react-json-reconciler';
import { flattenNodes } from 'react-json-reconciler';
import { SlotContext } from './components';
import type { WithChildren } from './types';

const IDSuffixContext = React.createContext<string>('root');

export const IndexSuffixStopContext = React.createContext<boolean>(false);

/** Get the generated id */
export const useGetIdPrefix = () => {
  return React.useContext(IDSuffixContext);
};

/** Add a suffix to a generated id */
export const IDSuffixProvider = (
  props: WithChildren<{
    /** The suffix to append */
    suffix: string;
  }>
) => {
  const currentPrefix = useGetIdPrefix();

  return (
    <IDSuffixContext.Provider
      value={[
        currentPrefix === 'root' ? undefined : currentPrefix,
        props.suffix,
      ]
        .filter(Boolean)
        .join('-')}
    >
      {props.children}
    </IDSuffixContext.Provider>
  );
};

/** Override the generated id with the supplied one */
export const IDProvider = (
  props: WithChildren<{
    /** The new id to use  */
    id?: string;
  }>
) => {
  if (props.id) {
    return (
      <IDSuffixContext.Provider value={props.id}>
        {props.children}
      </IDSuffixContext.Provider>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
};

/** Get the index of an item in a slot */
export const useIndexInSlot = (ref: React.RefObject<JsonNode>) => {
  const [index, setIndex] = React.useState(-1);
  const slotContext = React.useContext(SlotContext);

  React.useEffect(() => {
    if (!slotContext?.isArray) {
      throw new Error('Cannot get index in non-array slot');
    }

    if (ref.current && slotContext?.ref.current?.valueNode?.type === 'array') {
      const allChildren = flattenNodes(
        slotContext.ref.current.valueNode.children
      );
      const foundIndex = allChildren.indexOf(ref.current);

      if (foundIndex !== index) {
        setIndex(foundIndex);
      }
    }
  }, [index, ref, slotContext?.isArray, slotContext?.ref]);

  return index;
};

/** Add the index to the id path when in an array slot */
export const IDSuffixIndexProvider = (
  props: WithChildren<{
    /** The ref to use */
    wrapperRef: React.RefObject<JsonNode>;

    /** if the suffix is in a template, the id to use */
    templateIndex?: string;
  }>
) => {
  const slotIndex = useIndexInSlot(props.wrapperRef);

  const stopIndex = React.useContext(IndexSuffixStopContext);

  if (stopIndex) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{props.children}</>;
  }

  return (
    <IDSuffixProvider suffix={props.templateIndex ?? String(slotIndex)}>
      <IndexSuffixStopContext.Provider value>
        {props.children}
      </IndexSuffixStopContext.Provider>
    </IDSuffixProvider>
  );
};

/** Wrap a slot with the index if in an array slot */
export const OptionalIDSuffixProvider = (
  props: WithChildren<{
    /** The ref to walk upwards and use as an index */
    wrapperRef: React.RefObject<JsonNode>;

    /** if the suffix is in a template, the id to use */
    templateIndex?: string;
  }>
) => {
  const slotContext = React.useContext(SlotContext);

  if (slotContext?.isArray) {
    return (
      <IDSuffixIndexProvider
        wrapperRef={props.wrapperRef}
        templateIndex={props.templateIndex}
      >
        {props.children}
      </IDSuffixIndexProvider>
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
};
