import dlv from 'dlv';

/** A function that checks overlapping properties against a reference value */
export type Matcher = ((searchObj: object) => boolean) & {
  /** The count represents the specificity of this matcher */
  count: number;
};

/** Traverse an object and collect any key/value pairs including nested keys */
function traverseObj(
  object: Record<any, any>,
  path: string[] = [],
  pairs: Map<string[], any> = new Map(),
): Map<string[], any> {
  for (const key of Object.keys(object)) {
    const val: any = object[key];
    const nestedPath = [...path, key];
    ('');

    if (typeof val === 'object') {
      traverseObj(val, nestedPath, pairs);
    } else {
      pairs.set(nestedPath, val);
    }
  }

  return pairs;
}

/** Given an object, create a function that compares any set key/value pairs in the given object against a new value */
export default function createMatcher(partialObj: object): Matcher {
  // Convert the partial object into a list of [key, value] pairs;
  const pairs = traverseObj(partialObj);

  /** Generate a function to match against all of the properties we care about */
  const matchFunction = (searchObj: object) => {
    for (const entry of pairs) {
      const [path, value] = entry;

      if (dlv(searchObj, path) !== value) {
        return false;
      }
    }

    return true;
  };

  // Keep track of the specificity of the comparator
  matchFunction.count = pairs.size;

  return matchFunction;
}
