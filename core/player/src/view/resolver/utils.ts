import type { BindingInstance, BindingLike } from "../../binding";
import { isBinding } from "../../binding";
import type { ExpressionType } from "../../expressions";
import type { Resolve } from "./types";

/** Check to see if and of the data-changes affect the given dependencies  */
export function caresAboutDataChanges(
  dataChanges?: Set<BindingInstance>,
  dependencies?: Set<BindingInstance>,
) {
  if (!dataChanges || !dependencies) {
    return true;
  }

  const depArray = Array.from(dependencies.values());
  const dataChangeArray = Array.from(dataChanges.values());

  return (
    depArray.find(
      (dep) =>
        !!dataChangeArray.find(
          (change) =>
            change === dep || change.contains(dep) || dep.contains(change),
        ),
    ) !== undefined
  );
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

/**
 * helper function to flatten a potential nested array and combine with initial array
 */
export function unpackAndPush(item: any | any[], initial: any[]) {
  if (Array.isArray(item)) {
    item.forEach((i) => {
      unpackAndPush(i, initial);
    });
  } else {
    initial.push(item);
  }
}
