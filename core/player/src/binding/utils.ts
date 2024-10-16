import type { BindingLike, BindingInstance } from "./binding";

/** Check if the parameter representing a binding is already of the Binding class */
export function isBinding(binding: BindingLike): binding is BindingInstance {
  return !(typeof binding === "string" || Array.isArray(binding));
}

/** Convert the string to an int if you can, otherwise just return the original string */
export function maybeConvertToNum(i: string): string | number {
  const asInt = parseInt(i, 10);

  if (isNaN(asInt)) {
    return i;
  }

  return asInt;
}

/**
 * utility to convert binding into binding segments.
 */
export function getBindingSegments(
  binding: BindingLike,
): Array<string | number> {
  if (Array.isArray(binding)) {
    return binding;
  }

  if (typeof binding === "string") {
    return binding.split(".");
  }

  return binding.asArray();
}

/** Like _.findIndex, but ignores types */
export function findInArray<T extends Record<string | number, object>>(
  array: Array<T>,
  key: string | number,
  value: T,
): number | undefined {
  return array.findIndex((obj) => {
    if (obj && typeof obj === "object") {
      // Intentional double-equals because we want '4' to be coerced to 4
      // eslint-disable-next-line eqeqeq
      return obj[key] == value;
    }

    return false;
  });
}
