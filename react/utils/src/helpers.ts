/**
 * Trim leading and trailing slashes from string
 */
export function trimSlashes(str: string) {
  return str.replace(/^\/+|\/+$/g, '');
}

/**
 * Removes any key: value pairs from an object when the value is null or undefined
 */
export function removeEmptyValuesFromObject(
  obj: Record<string, any>
): Record<string, NonNullable<any>> {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];

    if (value !== null && value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {} as Record<string, any>);
}

/** Check if the object has no keys */
export function isEmptyObject(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

/** Check if the argument is a function */
export function isFunction<ReturnType>(
  maybeFn: ReturnType | ((...args: unknown[]) => ReturnType)
): maybeFn is (...args: unknown[]) => ReturnType {
  return Boolean(maybeFn instanceof Function || typeof maybeFn === 'function');
}

/**
 * Calls function with provided data or returns original value
 */
export function callOrReturn<
  ReturnType,
  FnArgs extends Array<unknown> = unknown[],
  FnType = (...args: FnArgs) => ReturnType
>(maybeFn: FnType | ReturnType, fnArgs: FnArgs): ReturnType {
  if (isFunction(maybeFn)) {
    return maybeFn(fnArgs) as ReturnType;
  }

  return maybeFn as ReturnType;
}
