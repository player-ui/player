import React, { useContext } from 'react';
import makeClass from 'clsx';
import { useAssetProps } from '@player-ui/react-utils';
import type { TextAsset } from '@player-ui/reference-assets-plugin';

export interface TextModifierContextType {
  getClassForModifier?<T>(modifier: T): string | undefined;
}

export const TextModifierContext = React.createContext<
  TextModifierContextType | undefined
>(undefined);

/** Get the props for a basic text element */
export const useText = (props: TextAsset): JSX.IntrinsicElements['span'] => {
  let className: string | undefined;

  const modifierContext = useContext(TextModifierContext);

  if (props.modifiers && modifierContext?.getClassForModifier) {
    className = makeClass(
      ...props.modifiers.map(modifierContext.getClassForModifier)
    );
  }

  return {
    ...useAssetProps(props),
    className,
    children: props.value,
  };
};
