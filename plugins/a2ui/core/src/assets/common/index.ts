import type { Asset, AssetWrapper, Expression } from "@player-ui/player";

/** Properties that any A2UI v0.9.1 component may carry. */
export interface A2UICommon {
  /** Optional accessibility description, mapped to `aria-label` in DOM. */
  accessibility?: string;
  /** Flex grow weight when this component sits inside a flex parent. */
  weight?: number;
}

/** Single child slot — adapter wraps inlined refs as `{ asset }`. */
export type A2UIChildAsset<T extends Asset = Asset> = AssetWrapper<T>;

/** Children slot — adapter emits `{asset}` wrappers; template form lives on Player's `template` field. */
export type A2UIChildrenAssets<T extends Asset = Asset> = Array<
  AssetWrapper<T>
>;

/**
 * After `adapter.translateAction` runs, an A2UI action collapses into two
 * sibling fields on the asset: `value` (the event name → transition target)
 * and optional `exp` (context-write expressions). Components that author an
 * `action` in A2UI inherit this shape.
 */
export interface A2UIActionFields {
  /** Transition value resolved from the A2UI event name. */
  value?: string;
  /** Optional expression(s) to evaluate before transitioning. */
  exp?: Expression;
}
