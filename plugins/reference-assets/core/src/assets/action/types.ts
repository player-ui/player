import type { Asset, AssetWrapper, Expression } from '@player-ui/player';
import type { BeaconDataType } from '@player-ui/beacon-plugin';

/**
 * User actions can be represented in several places.
 * Each view typically has one or more actions that allow the user to navigate away from that view.
 * In addition, several asset types can have actions that apply to that asset only.
 */
export interface ActionAsset<AnyTextAsset extends Asset = Asset>
  extends Asset<'action'> {
  /** The transition value of the action in the state machine */
  value?: string;

  /** A text-like asset for the action's label */
  label?: AssetWrapper<AnyTextAsset>;

  /** An optional expression to execute before transitioning */
  exp?: Expression;

  /** An optional string that describes the action for screen-readers */
  accessibility?: string;

  /** Additional optional data to assist with the action interactions on the page */
  metaData?: {
    /** Additional data to beacon */
    beacon?: BeaconDataType;

    /** Force transition to the next view without checking for validation */
    skipValidation?: boolean;

    /** boolean value to decide for the left anchor sign */
    role?: string;
  };
}

/** A stateful instance of an action */
export interface TransformedAction extends ActionAsset {
  /** A method to execute the action */
  run: () => void;
}
