import { BindingInstance } from "../../binding";

/** Recursively flattens a nested object to be an object of depth 1 with keys being the full path in the orginal object */
export function flatten(obj: any, roots: [string][] = [], sep = "."): any {
  return (
    Object
      // find props of given object
      .keys(obj)
      // return an object by iterating props
      .reduce(
        (memo, prop) => ({
          // create a new object

          // include previously returned object
          ...memo,
          ...(Object.prototype.toString.call(obj[prop]) === "[object Object]"
            ? // keep working if value is an object
              flatten(obj[prop], roots.concat([prop]))
            : // include current prop and value and prefix prop with the roots
              { [roots.concat([prop]).join(sep)]: obj[prop] }),
        }),
        {},
      )
  );
}

/** Converts an object into a list of binding/value tuples to use with a LocalModel object */
export function objectToBatchSet(obj: any): [BindingInstance, any][] {
  const flattenedObj = flatten(obj);
  const batchTxn: [BindingInstance, any][] = [];

  Object.keys(flattenedObj).forEach((key) => {
    batchTxn.push([new BindingInstance(key), flattenedObj[key]]);
  });

  return batchTxn;
}
