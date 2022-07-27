import type {
  Asset,
  Expression,
  Navigation as PlayerNav,
} from '@player-ui/types';
import type {
  BindingTemplateInstance,
  ExpressionTemplateInstance,
} from './string-templates';

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

type ValidKeys = 'exp' | 'onStart' | 'onEnd';

type DeepReplace<T, Old, New> = {
  [P in keyof T]: T[P] extends Old
    ? P extends ValidKeys
      ? New
      : DeepReplace<T[P], Old, New> // Set to new if one of the valid keys: replace with `? New` for all keys
    : T[P] extends (infer R)[] // Is this a Tuple or array
    ? DeepReplace<R, Old, New>[] // Replace the type of the tuple/array
    : T[P] extends object
    ? DeepReplace<T[P], Old, New>
    : Extract<T[P], Old> extends Old // Is this a union with the searched for type?
    ?
        | DeepReplace<Extract<T[P], object>, Old, New> // Replace all object types of the union
        | Exclude<T[P], Old | object> // Get all types that are not objects (handled above) or Old (handled below
        | New // Direct Replacement of Old
    : T[P];
};

export type Navigation = DeepReplace<
  PlayerNav,
  Expression,
  ExpressionTemplateInstance | ExpressionTemplateInstance[] | Expression
>;
