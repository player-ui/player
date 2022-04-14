import type { Asset } from '@player-ui/types';
import type {
  BindingTemplateInstance,
  ExpressionTemplateInstance,
} from './string-templates';
import { binding } from './string-templates';

export type WithChildren<T = Record<string, unknown>> = T & {
  /** child nodes */
  children?: React.ReactNode;
};

export type RemoveUnknownIndex<T> = {
  [P in keyof T as T[P] extends unknown
    ? unknown extends T[P]
      ? never
      : P
    : P]: T[P];
};

export type AddUnknownIndex<T> = T & {
  [key: string]: unknown;
};

/** Make an ID prop optional an a type */
export type OmitProp<T, K extends string> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

export interface PlayerApplicability {
  /** An expression to evaluate to determine if this node should appear in a view or not */
  applicability?:
    | BindingTemplateInstance
    | ExpressionTemplateInstance
    | boolean;
}

export type AssetPropsWithChildren<T extends Asset> = WithChildren<
  WithTemplateTypes<
    OmitProp<RemoveUnknownIndex<T>, 'id' | 'type'> & Partial<Pick<Asset, 'id'>>
  > &
    PlayerApplicability
>;

export type SwapKeysToType<T, K extends keyof T, NewType> = {
  [P in keyof T]: P extends K ? NewType : T[P];
};

export type WithTemplateTypes<T> = T extends Record<any, any>
  ? {
      [P in keyof T]: WithTemplateTypes<T[P]>;
    }
  : T | BindingTemplateInstance | ExpressionTemplateInstance;
