import type { CommitRecordsRequest } from "./types";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalBinding = (value: unknown): value is string | undefined =>
  value === undefined || (typeof value === "string" && value !== "");

/**
 * A commit-records state's request, or why it isn't one. `eachRow` sits on the state beside
 * `param`, not in it: Player resolves the templates in `param` when the state starts, which would
 * replace every {{binding}} in the expressions with its value at that moment.
 */
export function toCommitRequest(
  state: Readonly<Record<string, unknown>>,
): CommitRecordsRequest | { problem: string } {
  const { param, eachRow = [] } = state;
  if (!isPlainObject(param)) return { problem: "`param` must be an object" };
  if ("eachRow" in param) {
    return {
      problem:
        "`eachRow` goes on the state beside `param`, where Player leaves it as written",
    };
  }
  const { binding, update, rowBinding, save, remove } = param;
  if (typeof binding !== "string" || binding === "") {
    return { problem: "`param.binding` must name a collection" };
  }
  if (!optionalBinding(update) || !optionalBinding(rowBinding)) {
    return {
      problem: "`param.update` and `param.rowBinding` must be bindings",
    };
  }
  if (!optionalBinding(save) || !optionalBinding(remove)) {
    return { problem: "`param.save` and `param.remove` must be bindings" };
  }
  const expressions = Array.isArray(eachRow) ? eachRow : [eachRow];
  if (
    !expressions.every(
      (expression): expression is string => typeof expression === "string",
    )
  ) {
    return { problem: "`eachRow` must be an expression or a list of them" };
  }
  if (update && (!rowBinding || expressions.length === 0)) {
    return { problem: "`param.update` needs `param.rowBinding` and `eachRow`" };
  }
  return { binding, update, rowBinding, eachRow: expressions, save, remove };
}
