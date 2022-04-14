import type { Asset, Expression } from '@player-ui/player';

export interface TextAsset extends Asset<'text'> {
  /** The text to display */
  value: string;

  /** Any modifiers on the text */
  modifiers?: Array<TextModifier>;
}

export type TextModifier = BasicTextModifier | LinkModifier;

export interface BasicTextModifier {
  /** The modifier type */
  type: string;

  /** Modifiers can be named when used in strings */
  name?: string;

  /** A spot for other metaData or properties */
  [key: string]: unknown;
}

/** A modifier to turn the text into a link */
export interface LinkModifier {
  /** The link type denotes this as a link */
  type: 'link';

  /** An optional expression to run before the link is opened */
  exp?: Expression;

  /** metaData about the link's target */
  metaData: {
    /** The location of the link to load */
    ref: string;

    /** Used to indicate an application specific resolver to use */
    'mime-type'?: string;
  };
}
