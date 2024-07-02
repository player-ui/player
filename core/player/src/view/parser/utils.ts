import type { Node } from './types';

/** Check to see if the object contains async */
export function hasAsync(obj: object | undefined | null): boolean {
  if (obj) {
    return Object.prototype.hasOwnProperty.call(obj, 'async');
  }

  return false;
}

/**
 * Checks if there are templated values in the object
 *
 * @param obj - The Parsed Object to check to see if we have a template array type for
 * @param localKey - The key being checked
 */
export function hasTemplateValues(obj: any, localKey: string) {
  return (
    Object.hasOwnProperty.call(obj, 'template') &&
    Array.isArray(obj?.template) &&
    obj.template.length &&
    obj.template.find((tmpl: any) => tmpl.output === localKey)
  );
}

/** Check to see if the string is a valid switch key */
export function hasSwitchKey(localKey: string) {
  return localKey === ('staticSwitch' || 'dynamicSwitch');
}

/** Get the ID of the Node if there is one */
export function getNodeID(node?: Node.Node | null): string | undefined {
  if (!node) {
    return;
  }

  if (
    'value' in node &&
    typeof node.value === 'object' &&
    typeof node.value?.id === 'string'
  ) {
    return node.value.id;
  }
}
