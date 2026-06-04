import type { BindingInstance, BindingLike } from "../../binding";
import { isBinding } from "../../binding";
import type { ExpressionType } from "../../expressions";
import type { Resolve } from "./types";

/**
 * The same `dataChanges` set is checked against every node in a single update
 * pass, so cache its array form (keyed by set identity) to avoid rebuilding it
 * per node. The WeakMap lets old change-sets be garbage collected.
 */
const dataChangeArrayCache = new WeakMap<
  Set<BindingInstance>,
  Array<BindingInstance>
>();

/** Check to see if and of the data-changes affect the given dependencies  */
export function caresAboutDataChanges(
  dataChanges?: Set<BindingInstance>,
  dependencies?: Set<BindingInstance>,
) {
  if (!dataChanges || !dependencies) {
    return true;
  }

  let dataChangeArray = dataChangeArrayCache.get(dataChanges);
  if (dataChangeArray === undefined) {
    dataChangeArray = Array.from(dataChanges.values());
    dataChangeArrayCache.set(dataChanges, dataChangeArray);
  }

  const depArray = Array.from(dependencies.values());

  // Intentionally indexed loops with an early return for speed on the hot path.
  for (let i = 0; i < depArray.length; i++) {
    const dep = depArray[i];
    for (let j = 0; j < dataChangeArray.length; j++) {
      const change = dataChangeArray[j];
      if (change === dep || change.contains(dep) || dep.contains(change)) {
        return true;
      }
    }
  }

  return false;
}

/** Convert the options object for a resolver to one for a node */
export function toNodeResolveOptions(
  resolverOptions: Resolve.ResolverOptions,
): Resolve.NodeResolveOptions {
  return {
    ...resolverOptions,
    data: {
      model: resolverOptions.model,
      formatValue: (ref, value) => {
        if (resolverOptions.formatValue) {
          return resolverOptions.formatValue(ref, value);
        }

        return value;
      },
      format: (bindingLike: BindingLike, value: any) =>
        resolverOptions.format
          ? resolverOptions.format(
              isBinding(bindingLike)
                ? bindingLike
                : resolverOptions.parseBinding(bindingLike),
              value,
            )
          : value,
    },
    evaluate: (exp: ExpressionType) =>
      resolverOptions.evaluator.evaluate(exp, resolverOptions),
  };
}
