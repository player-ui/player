import type {
  Resolve,
  Store,
  BeforeTransformFunction,
  TransformFunction,
  TransformFunctions,
} from "@player-ui/player";

function composeTransforms(
  ...args: TransformFunction<any>[]
): TransformFunction<any>;

function composeTransforms(
  ...args: BeforeTransformFunction<any>[]
): BeforeTransformFunction<any>;

/**
 * More closely resembles the `compose` function you may have used. Performs
 * right-to-left function evaluation, but leveraging the common signature for
 * Transform Functions. The `options` and `store` is unchanging for each
 * transform since only `value` is returned, allowing them to safely be passed
 * into each transform.
 */
function composeTransforms(
  ...args: TransformFunction<any>[] | BeforeTransformFunction<any>[]
): TransformFunction<any> | BeforeTransformFunction<any> {
  const [fn, ...fns] = args.reverse();

  return (asset: any, options: Resolve.NodeResolveOptions, store: Store) => {
    const value = fn(asset, options, store);

    if (!fns.length) {
      return value;
    }

    return fns.reduce((prevValue, current) => {
      return current(prevValue, options, store);
    }, value);
  };
}

/**
 * Helper function to make it easier to create transforms that need to be ran in
 * the `beforeResolve` hook. Just like `compose`, functions are evaluated from
 * right-to-left.
 */
export function composeBefore(
  ...args: BeforeTransformFunction<any>[]
): TransformFunctions {
  return {
    beforeResolve: composeTransforms(...args),
  };
}

/**
 * Performs right-to-left function evaluation of each transform function. Unlike
 * other compose functions, this does not require unary arguments for all but the
 * last function. The value returned from each function will be used as the value
 * for the next function.
 */
export function compose(
  ...args: Array<TransformFunction<any> | TransformFunctions>
): TransformFunctions {
  const beforeResolveFns: BeforeTransformFunction<any>[] = [];
  const resolveFns: TransformFunction<any>[] = [];

  for (const arg of args) {
    if (typeof arg === "function") {
      resolveFns.push(arg);
    } else {
      if (arg?.resolve) {
        resolveFns.push(arg.resolve);
      }

      if (arg?.beforeResolve) {
        beforeResolveFns.push(arg.beforeResolve);
      }
    }
  }

  return {
    beforeResolve: beforeResolveFns.length
      ? composeTransforms(...beforeResolveFns)
      : undefined,
    resolve: resolveFns.length ? composeTransforms(...resolveFns) : undefined,
  };
}
