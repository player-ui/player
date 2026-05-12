/**
 * Synthesize a Player Schema from A2UI input components that carry `checks`.
 *
 * A2UI exposes per-input validation via a `checks: [...]` array of function
 * calls (required, regex, length, numeric, email). Player expresses validation
 * as per-binding `validation: [...]` references attached to schema DataTypes,
 * resolved through a hierarchy of named types starting at ROOT.
 *
 * We walk every component, find each input's bound data path via a lookup of
 * the basic_catalog's input components, translate its checks to Player
 * validation references, and build up nested types named from the path
 * segments. The output Schema slots directly into `Flow.schema`, where
 * Player's existing SchemaController + ValidationController pick it up
 * unchanged.
 */

import type { Logger } from "../logger";
import type { Schema as SchemaType, Validation } from "@player-ui/types";
import type { A2UICheck, A2UIComponent, A2UIDynamicValue } from "./types";
import { bindingToSegments, pointerToBinding } from "./binding";
import { isPathRef } from "./dynamic";

/** Map A2UI input component names to the prop that carries their bound path. */
const INPUT_BINDING_PROPS: Record<string, string> = {
  TextField: "text",
  CheckBox: "checked",
  DateTimeInput: "value",
  ChoicePicker: "value",
  Slider: "value",
};

/** Map A2UI check call names to Player validation type names. */
const CHECK_TO_VALIDATOR: Record<string, string> = {
  required: "required",
  regex: "regex",
  email: "email",
  length: "length",
  numeric: "numeric",
};

/** Synthesized intermediate type names get this prefix to avoid collisions. */
const TYPE_PREFIX = "T_";

interface SchemaBuilder {
  schema: SchemaType.Schema;
  /** Track which synthesized type names we've already created. */
  knownTypes: Set<string>;
}

function newBuilder(): SchemaBuilder {
  return {
    schema: { ROOT: {} },
    knownTypes: new Set(["ROOT"]),
  };
}

/**
 * Find the data path an input component writes to:
 *   1. Use the lookup table for known basic_catalog inputs.
 *   2. Fallback: if the component has exactly one {path} ref anywhere, use it.
 */
function findBoundPath(
  component: A2UIComponent,
  logger?: Logger,
): string | undefined {
  const lookupProp = INPUT_BINDING_PROPS[component.component];
  if (lookupProp) {
    const prop = component[lookupProp];
    if (isPathRef(prop)) return prop.path;
  }

  const pathRefs = collectPathRefs(component);
  if (pathRefs.length === 1) return pathRefs[0];
  if (pathRefs.length > 1) {
    logger?.warn(
      `[a2ui] Component '${component.id}' (${component.component}) has checks but multiple {path} refs; skipping schema synthesis for this component`,
    );
  } else {
    logger?.warn(
      `[a2ui] Component '${component.id}' (${component.component}) has checks but no bound path could be determined; skipping`,
    );
  }
  return undefined;
}

function collectPathRefs(component: A2UIComponent): string[] {
  const found: string[] = [];
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    if (isPathRef(v)) {
      found.push((v as { path: string }).path);
      return;
    }
    Object.values(v as Record<string, unknown>).forEach(walk);
  };
  for (const [k, v] of Object.entries(component)) {
    if (k === "id" || k === "component" || k === "checks" || k === "action") {
      continue;
    }
    walk(v);
  }
  return found;
}

/** Translate one A2UI check to a Player Validation.Reference. */
function translateCheck(
  check: A2UICheck,
  logger?: Logger,
): Validation.Reference | undefined {
  const type = CHECK_TO_VALIDATOR[check.call];
  if (!type) {
    logger?.warn(`[a2ui] Unknown validation check '${check.call}'; dropping`);
    return undefined;
  }

  const ref: Validation.Reference = {
    type,
    severity: "error",
  };
  if (check.message) ref.message = check.message;

  // Hoist call-specific args onto the validation reference. Player validators
  // expect their config flat on the reference object (e.g. regex.regex,
  // length.min/max).
  if (check.call === "regex" && check.args?.pattern) {
    ref.regex = unwrapLiteral(check.args.pattern);
  }
  if (check.call === "length") {
    if (check.args?.min !== undefined) ref.min = unwrapLiteral(check.args.min);
    if (check.args?.max !== undefined) ref.max = unwrapLiteral(check.args.max);
  }
  return ref;
}

function unwrapLiteral(value: A2UIDynamicValue): unknown {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  // {path} or {call} args on validators are unusual; pass through as-is for
  // platform-specific validators that may understand them.
  return value;
}

/**
 * Walk binding segments and install a leaf DataType + validation refs at the
 * correct nested type. Synthesizes intermediate type names from the path.
 *
 * Array-index segments (`[0]`) are skipped: A2UI's checks attach to a specific
 * element of a model array, but Player's per-binding validation already
 * applies across array elements. v1 treats array-indexed paths as if they
 * targeted the parent collection's element shape.
 */
function installAtPath(
  builder: SchemaBuilder,
  binding: string,
  leafType: string,
  validations: Validation.Reference[],
  logger?: Logger,
): void {
  const segments = bindingToSegments(binding).filter((s) => !s.startsWith("["));
  if (segments.length === 0) {
    logger?.warn(
      `[a2ui] Cannot install schema validation at empty path; skipping`,
    );
    return;
  }

  let currentNode: SchemaType.Node = builder.schema.ROOT;
  const ownerPath: string[] = [];
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    ownerPath.push(seg);
    const typeName = `${TYPE_PREFIX}${ownerPath.join("_")}`;

    const existing = currentNode[seg];
    if (!existing) {
      currentNode[seg] = { type: typeName };
    } else if (existing.type !== typeName) {
      // Different code path already used this intermediate; keep its type and
      // descend into whatever node it points to.
    }

    const ref = currentNode[seg].type;
    if (!builder.schema[ref]) {
      builder.schema[ref] = {};
      builder.knownTypes.add(ref);
    }
    currentNode = builder.schema[ref];
  }

  const leafSeg = segments[segments.length - 1];
  const existingLeaf = currentNode[leafSeg];
  if (existingLeaf) {
    const merged: SchemaType.DataType = {
      ...existingLeaf,
      type: pickLeafType(existingLeaf.type, leafType),
      validation: [...(existingLeaf.validation ?? []), ...validations],
    };
    currentNode[leafSeg] = merged;
  } else {
    currentNode[leafSeg] = { type: leafType, validation: validations };
  }
}

function pickLeafType(existing: string, incoming: string): string {
  // "number" / "boolean" are more specific than the default "string".
  if (incoming !== "string") return incoming;
  return existing;
}

function defaultLeafType(
  component: A2UIComponent,
  checks: A2UICheck[],
): string {
  if (component.component === "CheckBox") return "boolean";
  if (checks.some((c) => c.call === "numeric")) return "number";
  return "string";
}

/**
 * Build a Player Schema from the given components. Returns `undefined` if no
 * checks were found anywhere (the synthesized Flow then omits `schema`
 * entirely).
 */
export function synthesizeSchema(
  components: A2UIComponent[],
  logger?: Logger,
): SchemaType.Schema | undefined {
  const builder = newBuilder();
  let found = false;

  for (const component of components) {
    if (!component.checks || component.checks.length === 0) continue;

    const pointer = findBoundPath(component, logger);
    if (!pointer) continue;

    const binding = pointerToBinding(pointer);
    if (!binding) continue;

    const validations = component.checks
      .map((c) => translateCheck(c, logger))
      .filter((v): v is Validation.Reference => v !== undefined);
    if (validations.length === 0) continue;

    installAtPath(
      builder,
      binding,
      defaultLeafType(component, component.checks),
      validations,
      logger,
    );
    found = true;
  }

  return found ? builder.schema : undefined;
}
