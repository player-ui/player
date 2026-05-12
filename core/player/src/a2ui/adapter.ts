/**
 * Convert an A2UI snapshot to a Player Flow.
 *
 * The A2UI snapshot is a flat list of components linked by id, starting from
 * `id: "root"`. The adapter walks from root, inlines child references into a
 * nested asset tree (matching Player's authored shape: `{asset: ...}` wrappers
 * around nested components), translates Dynamic* values + actions, lifts input
 * checks into a synthesized Schema, and emits a Flow with a single VIEW state
 * and one END state per unique event name encountered. Player's existing
 * parser/resolver/flow pipeline then runs unchanged.
 */

import type { Asset, Flow, NavigationFlow } from "@player-ui/types";
import type { Logger } from "../logger";
import type {
  A2UIComponent,
  A2UIDynamicValue,
  A2UIEventAction,
  A2UIFunctionCallAction,
  A2UISnapshot,
} from "./types";
import { A2UI_EVENT_CONTEXT_NAMESPACE } from "./types";
import { pointerToBinding } from "./binding";
import { isFunctionCall, isPathRef, translateFunctionCall } from "./dynamic";
import { synthesizeSchema } from "./schema";

const STRUCTURAL_KEYS = new Set([
  "id",
  "component",
  "child",
  "children",
  "checks",
  "action",
]);

interface WalkContext {
  byId: Map<string, A2UIComponent>;
  inProgress: Set<string>;
  eventNames: Set<string>;
  logger?: Logger;
}

/**
 * Translate a single A2UI component (and its referenced children) into a
 * Player Asset tree.
 *
 * `templateScope` is set when this component is inlined inside a templated
 * `children: {path, componentId}` block. Relative paths inside the subtree
 * are then resolved against `<scope>._index_`.
 */
function inlineComponent(
  component: A2UIComponent,
  ctx: WalkContext,
  templateScope?: string,
): Asset {
  if (ctx.inProgress.has(component.id)) {
    throw new Error(
      `[a2ui] Component cycle detected at id '${component.id}'. A2UI requires the component graph to be a tree.`,
    );
  }
  ctx.inProgress.add(component.id);

  const asset: Asset = {
    id: component.id,
    type: component.component,
  };

  // Non-structural props get Dynamic* translation.
  for (const [key, value] of Object.entries(component)) {
    if (STRUCTURAL_KEYS.has(key)) continue;
    asset[key] = translatePropValue(
      value as A2UIDynamicValue,
      templateScope,
      ctx.logger,
    );
  }

  if (typeof component.child === "string") {
    const childId = component.child;
    asset.child = wrapInlined(resolveAndInline(childId, ctx, templateScope));
  }

  if (component.children) {
    if (Array.isArray(component.children)) {
      asset.children = component.children.map((id) =>
        wrapInlined(resolveAndInline(id, ctx, templateScope)),
      );
    } else {
      // Templated children: { path, componentId }
      const { path, componentId } = component.children;
      const data = scopedBinding(path, templateScope);
      const templateComponent = ctx.byId.get(componentId);
      if (!templateComponent) {
        throw new Error(
          `[a2ui] Templated children reference unknown componentId '${componentId}' on component '${component.id}'.`,
        );
      }
      // The template subtree iterates over `data` items. Pre-translate it with
      // `data` as the relative scope, and uniquify ids via `_index_` so each
      // expansion gets a distinct asset id.
      const templated = inlineComponent(
        { ...templateComponent, id: `${templateComponent.id}-_index_` },
        ctx,
        data,
      );
      asset.template = [
        {
          data,
          output: "children",
          value: { asset: templated },
        },
      ];
    }
  }

  if (component.action) {
    Object.assign(asset, translateAction(component.action, ctx));
  }

  ctx.inProgress.delete(component.id);
  return asset;
}

function resolveAndInline(
  id: string,
  ctx: WalkContext,
  templateScope?: string,
): Asset {
  const component = ctx.byId.get(id);
  if (!component) {
    throw new Error(
      `[a2ui] Component reference '${id}' could not be resolved in the snapshot.`,
    );
  }
  return inlineComponent(component, ctx, templateScope);
}

/** Wrap an inlined component in Player's `{asset: ...}` convention. */
function wrapInlined(asset: Asset): { asset: Asset } {
  return { asset };
}

/**
 * Translate a non-structural prop value. Identical to translateDynamicValue
 * but threads a template scope through so relative `{path}` refs become
 * `<scope>._index_.<...>`.
 */
function translatePropValue(
  value: A2UIDynamicValue,
  templateScope?: string,
  logger?: Logger,
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => translatePropValue(v, templateScope, logger));
  }
  if (isPathRef(value)) {
    return scopedBinding(value.path, templateScope);
  }
  if (isFunctionCall(value)) {
    if (templateScope) {
      // Rewrite path refs inside the call's args to be scope-aware before
      // translation runs.
      return translateFunctionCall(
        rewritePathsInCall(value, templateScope) as never,
        logger,
      );
    }
    return translateFunctionCall(value as never, logger);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = translatePropValue(v as A2UIDynamicValue, templateScope, logger);
  }
  return out;
}

function rewritePathsInCall(value: unknown, scope: string): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => rewritePathsInCall(v, scope));
  }
  if (isPathRef(value)) {
    return { path: scopedPointer(value.path, scope) };
  }
  if (isFunctionCall(value)) {
    return {
      ...value,
      args: value.args
        ? (Object.fromEntries(
            Object.entries(value.args).map(([k, v]) => [
              k,
              rewritePathsInCall(v, scope),
            ]),
          ) as never)
        : value.args,
    };
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      rewritePathsInCall(v, scope),
    ]),
  );
}

/**
 * Resolve an A2UI pointer to a Player binding string, taking template scope
 * into account for relative paths.
 *
 *   absolute pointer + no scope: pointerToBinding("/x/y") = "x.y"
 *   absolute pointer + scope:    pointerToBinding("/x/y") = "x.y"   (scope ignored)
 *   relative pointer + scope:    "<scope>._index_.x.y"
 *   relative pointer + no scope: "x.y"                              (treated as binding)
 */
function scopedBinding(pointer: string, scope?: string): string {
  if (!pointer || pointer === "/") return scope ?? "";
  if (pointer.startsWith("/")) return pointerToBinding(pointer);
  if (!scope) return pointerToBinding(pointer);
  const relative = pointerToBinding(pointer);
  return relative ? `${scope}._index_.${relative}` : `${scope}._index_`;
}

/**
 * Same as scopedBinding but emits a JSON Pointer (for re-injecting into a
 * function call before that call's args go through standard translation).
 * The result has no leading slash so the downstream binding helper treats it
 * as already-resolved.
 */
function scopedPointer(pointer: string, scope: string): string {
  if (pointer.startsWith("/")) return pointer;
  return `/${scope}/_index_/${pointer}`;
}

interface ActionPlayer {
  value?: string;
  exp?: string | string[];
}

function translateAction(
  action: A2UIEventAction | A2UIFunctionCallAction,
  ctx: WalkContext,
): ActionPlayer {
  if ("event" in action) {
    const { name, context } = action.event;
    ctx.eventNames.add(name);
    const result: ActionPlayer = { value: name };
    if (context && Object.keys(context).length > 0) {
      result.exp = buildContextWriteExpressions(context);
    }
    return result;
  }
  // functionCall action: no transition value, just an expression.
  return { exp: translateFunctionCall(action.functionCall, ctx.logger) };
}

function buildContextWriteExpressions(
  context: Record<string, A2UIDynamicValue>,
): string[] {
  return Object.entries(context).map(([key, value]) => {
    const lhs = `{{${A2UI_EVENT_CONTEXT_NAMESPACE}.${key}}}`;
    return `${lhs} = ${renderRhs(value)}`;
  });
}

function renderRhs(value: A2UIDynamicValue): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(renderRhs).join(", ")}]`;
  }
  if (isPathRef(value)) {
    return `{{${pointerToBinding(value.path)}}}`;
  }
  if (isFunctionCall(value)) {
    return translateFunctionCall(value).replace(/^@\[/, "").replace(/\]@$/, "");
  }
  return JSON.stringify(value);
}

function buildNavigation(
  surfaceId: string,
  eventNames: Set<string>,
): Flow["navigation"] {
  const view: NavigationFlow[string] = {
    state_type: "VIEW",
    ref: surfaceId,
    transitions: {
      "*": "END_Done",
    } as Record<string, string>,
  } as never;

  const endStates: Record<string, NavigationFlow[string]> = {
    END_Done: { state_type: "END", outcome: "done" } as never,
  };

  for (const name of eventNames) {
    const endName = `END_${name}`;
    (view as { transitions: Record<string, string> }).transitions[name] =
      endName;
    endStates[endName] = {
      state_type: "END",
      outcome: name,
    } as never;
  }

  const flow: NavigationFlow = {
    startState: "VIEW_1",
    VIEW_1: view,
    ...endStates,
  };

  return {
    BEGIN: "FLOW_1",
    FLOW_1: flow,
  };
}

export function adaptA2UIToFlow(snapshot: A2UISnapshot, logger?: Logger): Flow {
  if (!snapshot || !Array.isArray(snapshot.components)) {
    throw new Error("[a2ui] snapshot.components must be an array");
  }

  const byId = new Map<string, A2UIComponent>();
  for (const component of snapshot.components) {
    if (!component?.id) {
      throw new Error("[a2ui] every component must have an id");
    }
    byId.set(component.id, component);
  }

  const root = byId.get("root");
  if (!root) {
    throw new Error("[a2ui] snapshot must contain a component with id 'root'");
  }

  const ctx: WalkContext = {
    byId,
    inProgress: new Set(),
    eventNames: new Set(),
    logger,
  };

  const rootAsset = inlineComponent(root, ctx);
  // Player uses the View's id as the navigation `ref`; map root's id to the
  // surface id so the synthesized navigation can target it.
  rootAsset.id = snapshot.surfaceId;

  const schema = synthesizeSchema(snapshot.components, logger);

  const flow: Flow = {
    id: snapshot.surfaceId,
    views: [rootAsset],
    data: (snapshot.dataModel as Record<string, unknown>) ?? {},
    navigation: buildNavigation(snapshot.surfaceId, ctx.eventNames),
  };
  if (schema) flow.schema = schema;

  return flow;
}
