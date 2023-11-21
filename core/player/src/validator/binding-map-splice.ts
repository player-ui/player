import type { BindingInstance } from '../binding';

/**
 * Remove a binding, and any children from from the map
 * If the binding is an array-item, then it will be spliced from the array and the others will be shifted down
 *
 * @param sourceMap - A map of bindings to values
 * @param binding - The binding to remove from the map
 */
export function removeBindingAndChildrenFromMap<T>(
  sourceMap: Map<BindingInstance, T>,
  binding: BindingInstance,
): Map<BindingInstance, T> {
  const targetMap = new Map(sourceMap);

  const parentBinding = binding.parent();
  const property = binding.key();

  // Clear out any that are sub-bindings of this binding

  targetMap.forEach((_value, trackedBinding) => {
    if (binding === trackedBinding || binding.contains(trackedBinding)) {
      targetMap.delete(trackedBinding);
    }
  });

  if (typeof property === 'number') {
    // Splice out this index from the rest

    // Order matters here b/c we are shifting items in the array
    // Start with the smallest index and work our way down
    const bindingsToRewrite = Array.from(sourceMap.keys())
      .filter((b) => {
        if (parentBinding.contains(b)) {
          const [childIndex] = b.relative(parentBinding);
          return typeof childIndex === 'number' && childIndex > property;
        }

        return false;
      })
      .sort();

    bindingsToRewrite.forEach((trackedBinding) => {
      // If the tracked binding is a sub-binding of the parent binding, then we need to
      // update the path to reflect the new index

      const [childIndex, ...childPath] = trackedBinding.relative(parentBinding);

      if (typeof childIndex === 'number') {
        const newSegments = [childIndex - 1, ...childPath];
        const newChildBinding = parentBinding.descendent(newSegments);
        targetMap.set(newChildBinding, targetMap.get(trackedBinding) as T);
        targetMap.delete(trackedBinding);
      }
    });
  }

  return targetMap;
}
