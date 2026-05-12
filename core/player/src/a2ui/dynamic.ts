/**
 * Translate A2UI Dynamic* field values to Player-shaped equivalents.
 *
 *   literal            -> passed through unchanged
 *   {path: "/x/y"}     -> "x.y"                       (bare binding string)
 *   formatString(...)  -> "Hello, {{x.y}}!"           (template literal)
 *   {call, args}       -> "@[fnName(arg1, arg2)]@"    (Player expression)
 *
 * formatString is special-cased because string interpolation is a template,
 * not an expression. Everything else with a `call` becomes an expression so
 * Player's existing ExpressionEvaluator can dispatch to registered handlers.
 */

import type { Logger } from "../logger";
import type { A2UIDynamicValue, A2UIFunctionCall, A2UIPathRef } from "./types";
import { interpolatePointers, pointerToBinding } from "./binding";

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const isPathRef = (v: unknown): v is A2UIPathRef =>
  isObject(v) && typeof v.path === "string" && Object.keys(v).length === 1;

export const isFunctionCall = (v: unknown): v is A2UIFunctionCall =>
  isObject(v) && typeof v.call === "string";

/**
 * Translate a single Dynamic* value. The result is whatever shape Player
 * expects in that position: a literal, a binding string, a template string,
 * or an expression string.
 */
export function translateDynamicValue(
  value: A2UIDynamicValue,
  logger?: Logger,
): unknown {
  if (value === null || value === undefined) return value;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => translateDynamicValue(v, logger));
  }

  if (isPathRef(value)) {
    return pointerToBinding(value.path);
  }

  if (isFunctionCall(value)) {
    return translateFunctionCall(value, logger);
  }

  // Plain object: recurse into properties.
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = translateDynamicValue(v as A2UIDynamicValue, logger);
  }
  return out;
}

/**
 * Translate a {call, args} function call. `formatString` becomes a Player
 * template string; everything else becomes a Player expression `@[...]@`.
 */
export function translateFunctionCall(
  call: A2UIFunctionCall,
  logger?: Logger,
): string {
  if (call.call === "formatString") {
    const value = call.args?.value;
    if (typeof value === "string") return interpolatePointers(value);
    // Non-string formatString arg is technically off-spec; fall through to the
    // generic expression path so we at least emit something inspectable.
    logger?.warn(
      `[a2ui] formatString received non-string 'value' arg; emitting expression form`,
    );
  }

  const argList = renderArgList(call.args);
  if (call.call === "formatString") {
    return `@[formatString(${argList})]@`;
  }
  return `@[${call.call}(${argList})]@`;
}

/**
 * Render a call's args as a comma-separated argument list for use inside
 * `@[...]@`. A2UI args are a named map but Player expressions are positional,
 * so we serialize values in insertion order. Most A2UI functions take 1-2 args
 * and the order is stable across implementations; for more complex calls a
 * platform-specific expression handler can re-parse them.
 */
function renderArgList(args: A2UIFunctionCall["args"]): string {
  if (!args) return "";
  return Object.values(args).map(renderArg).join(", ");
}

function renderArg(value: A2UIDynamicValue): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(renderArg).join(", ")}]`;
  }
  if (isPathRef(value)) {
    // Bare binding ref inside an expression — Player resolves it from the data
    // model when the expression evaluates.
    return pointerToBinding(value.path);
  }
  if (isFunctionCall(value)) {
    // Nested call: drop the outer @[...]@ wrap so it composes inside the parent.
    const inner = translateFunctionCall(value);
    return inner.replace(/^@\[/, "").replace(/\]@$/, "");
  }
  // Plain object literal — JSON-serialize.
  return JSON.stringify(value);
}
