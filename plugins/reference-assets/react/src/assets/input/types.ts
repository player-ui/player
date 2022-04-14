import type { TransformedInput } from '@player-ui/reference-assets-plugin';

export type KeyDownHandler = (
  currentValue: string,
  props?: TransformedInput
) => any;
