import type { ChoicesEntry, TransformedChoicesEntry } from './types';

/**
 * Choice asset transform
 */
export const choicesEntryTransform: (entry: ChoicesEntry) => TransformedChoicesEntry = (
  entry
) => {
  return {
    ...entry,
    set(val) {
      this.selected = val
      return
    },
    selected: false
  };
};