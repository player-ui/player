import type { Asset, AssetSwitch } from '@player-ui/types';

/** Check to see if the object contains a switch */
export function hasSwitch(obj: object): obj is AssetSwitch<Asset> {
  return (
    Object.prototype.hasOwnProperty.call(obj, 'dynamicSwitch') ||
    Object.prototype.hasOwnProperty.call(obj, 'staticSwitch')
  );
}

/** Check to see if the object contains applicability */
export function hasApplicability(obj: object): boolean {
  return Object.prototype.hasOwnProperty.call(obj, 'applicability');
}
