type ReplacerFunction = (key: string, value: any) => any;

/** Returns a function to be used as the `replacer` for JSON.stringify that tracks and ignores circular references. */
export const makeJsonStringifyReplacer = (): ReplacerFunction => {
  const cache = new Set();
  return (_: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Circular reference found, discard key
        return "[CIRCULAR]";
      }
      // Store value in our collection
      cache.add(value);
    }
    return value;
  };
};
