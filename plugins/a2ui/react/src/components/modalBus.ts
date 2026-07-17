import * as React from "react";

/**
 * ID-keyed pub/sub linking actionless Buttons (or any trigger asset) to
 * Modals. Module-level since A2UI assets mount under Player's renderer with
 * no shared React wrapper to host a context provider.
 */

const subscribers = new Map<string, Set<() => void>>();

export function openModal(triggerId: string): void {
  subscribers.get(triggerId)?.forEach((fn) => fn());
}

export function useModalTrigger(
  triggerId: string | undefined,
  onOpen: () => void,
): void {
  React.useEffect(() => {
    if (!triggerId) return;
    const set = subscribers.get(triggerId) ?? new Set<() => void>();
    set.add(onOpen);
    subscribers.set(triggerId, set);
    return () => {
      set.delete(onOpen);
      if (set.size === 0) subscribers.delete(triggerId);
    };
  }, [triggerId, onOpen]);
}
