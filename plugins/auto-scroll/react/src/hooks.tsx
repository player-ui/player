import type { PropsWithChildren } from "react";
import React, { useEffect, useState } from "react";
import scrollIntoViewWithOffset from "./scrollIntoViewWithOffset";
import type { ScrollType } from "./index";

export interface AutoScrollProviderProps {
  /** Return the element to scroll to based on the registered types */
  getElementToScrollTo: (
    scrollableElements: Map<ScrollType, Set<string>>,
  ) => string;
  /** Optional function to get container element, which is used for calculating offset (default: document.body) */
  getBaseElement: () => HTMLElement | undefined | null;
  /** Additional offset to be used (default: 0) */
  offset: number;
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
  getBaseElement,
  offset,
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
      scrollIntoViewWithOffset(node, getBaseElement() || document.body, offset);
    }
  });

  return (
    <AutoScrollManagerContext.Provider value={{ register }}>
      {children}
    </AutoScrollManagerContext.Provider>
  );
};
