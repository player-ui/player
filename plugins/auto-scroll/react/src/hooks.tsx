import type { PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';
import type { ScrollType } from './index';

export interface AutoScrollProviderProps {
  /** Return the element to scroll to based on the registered types */
  getElementToScrollTo: (
    scrollableElements: Map<ScrollType, Set<string>>
  ) => string;
}

export interface RegisterData {
  /** when to scroll to the target  */
  type: ScrollType;

  /** the html id to scroll to */
  ref: string;
}

export type ScrollFunction = (registerData: RegisterData) => void;

export const AutoScrollManagerContext = React.createContext<{
  /** function to register a scroll target */
  register: ScrollFunction;
}>({ register: () => {} });

/** hook to register as a scroll target */
export const useRegisterAsScrollable = (): ScrollFunction => {
  const { register } = React.useContext(AutoScrollManagerContext);

  return register;
};

/** Component to handle scrolling */
export const AutoScrollProvider = ({
  getElementToScrollTo,
  children,
}: PropsWithChildren<AutoScrollProviderProps>) => {
  // Tracker for what elements are registered to be scroll targets
  // Key is the type (initial, validation, appear)
  // Value is a set of target ids
  const [scrollableMap, setScrollableMap] = useState<
    Map<ScrollType, Set<string>>
  >(new Map());

  /** Add a new entry as a scroll target */
  const updateScrollableMap = (key: ScrollType, value: string) => {
    setScrollableMap((prev) => {
      const nm = new Map(prev);

      if (!nm.get(key)) {
        nm.set(key, new Set());
      }

      nm.get(key)?.add(value);

      return nm;
    });
  };

  /** register a new scroll target */
  const register: ScrollFunction = (data) => {
    updateScrollableMap(data.type, data.ref);
  };

  useEffect(() => {
    const node = document.getElementById(getElementToScrollTo(scrollableMap));

    if (node) {
      scrollIntoView(node, {
        block: 'center',
        inline: 'center',
      });
    }
  });

  return (
    <AutoScrollManagerContext.Provider value={{ register }}>
      {children}
    </AutoScrollManagerContext.Provider>
  );
};
