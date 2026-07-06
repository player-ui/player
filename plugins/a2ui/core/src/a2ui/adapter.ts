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

import type {
  Asset,
  Flow,
  NavigationFlow,
  NavigationFlowEndState,
  NavigationFlowViewState,
} from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import type {
  A2UIComponent,
  A2UIDynamicValue,
  A2UIEventAction,
  A2UIFunctionCall,
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

  // Non-structural props get Dynamic* translation. Properties whose name ends
  // in `Child`/`Children` (e.g. Modal.entryPointChild, Modal.contentChild) are
  // treated as asset-ID references and inlined into `{asset: ...}` wrappers.
  for (const [key, value] of Object.entries(component)) {
    if (STRUCTURAL_KEYS.has(key)) continue;
    asset[key] = translatePropValue(
      value as A2UIDynamicValue,
      templateScope,
      ctx,
      key,
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

const CHILD_KEY_RE = /(?:^|[a-z])Child$|^child$/;
const CHILDREN_KEY_RE = /(?:^|[a-z])Children$|^children$/;

/**
 * Translate a non-structural prop value. Threads template scope so relative
 * `{path}` refs become `<scope>._index_.<...>`. Also resolves nested
 * `child`/`*Child` and `children`/`*Children` keys (e.g. `Modal.entryPointChild`,
 * `Tabs.tabItems[].child`) as asset-ID references, inlining them into
 * Player's `{asset: ...}` wrapper shape.
 *
 * `parentKey` is the property name of the currently-translated value within
 * its enclosing object (when known) — used to detect child-slot semantics.
 */
function translatePropValue(
  value: A2UIDynamicValue,
  templateScope: string | undefined,
  ctx: WalkContext,
  parentKey?: string,
): unknown {
  if (value === null || value === undefined) return value;

  // Resolve `child` / `*Child` ID references.
  if (parentKey && CHILD_KEY_RE.test(parentKey) && typeof value === "string") {
    return wrapInlined(resolveAndInline(value, ctx, templateScope));
  }
  // Resolve `children` / `*Children` ID-array references. Templated form
  // ({path, componentId}) is only supported at top level — punt with a warn.
  if (parentKey && CHILDREN_KEY_RE.test(parentKey)) {
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      return (value as string[]).map((id) =>
        wrapInlined(resolveAndInline(id, ctx, templateScope)),
      );
    }
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      "componentId" in (value as Record<string, unknown>)
    ) {
      ctx.logger?.warn(
        `[a2ui] Templated children are only supported at top-level 'children'; '${parentKey}' will be left unresolved.`,
      );
    }
  }

  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((v) =>
      translatePropValue(v, templateScope, ctx, undefined),
    );
  }
  if (isPathRef(value)) {
    return scopedBinding(value.path, templateScope);
  }
  if (isFunctionCall(value)) {
    if (templateScope) {
      return translateFunctionCall(
        rewritePathsInCall(value, templateScope),
        ctx.logger,
      );
    }
    return translateFunctionCall(value, ctx.logger);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = translatePropValue(v as A2UIDynamicValue, templateScope, ctx, k);
  }
  return out;
}

function rewritePathsInCall(
  value: A2UIFunctionCall,
  scope: string,
): A2UIFunctionCall;
function rewritePathsInCall(
  value: A2UIDynamicValue,
  scope: string,
): A2UIDynamicValue;
function rewritePathsInCall(
  value: A2UIDynamicValue,
  scope: string,
): A2UIDynamicValue {
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
      args: value.args ? rewriteCallArgs(value.args, scope) : value.args,
    };
  }
  return rewriteCallArgs(value, scope);
}

function rewriteCallArgs(
  args: Record<string, A2UIDynamicValue>,
  scope: string,
): Record<string, A2UIDynamicValue> {
  const out: Record<string, A2UIDynamicValue> = {};
  for (const [k, v] of Object.entries(args)) {
    out[k] = rewritePathsInCall(v, scope);
  }
  return out;
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
  const view: NavigationFlowViewState = {
    state_type: "VIEW",
    ref: surfaceId,
    transitions: {
      "*": "END_Done",
    },
  };

  const endStates: Record<string, NavigationFlowEndState> = {
    END_Done: { state_type: "END", outcome: "done" },
  };

  for (const name of eventNames) {
    const endName = `END_${name}`;
    view.transitions[name] = endName;
    endStates[endName] = {
      state_type: "END",
      outcome: name,
    };
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
    data: (snapshot.data as Record<string, unknown>) ?? {},
    navigation: buildNavigation(snapshot.surfaceId, ctx.eventNames),
  };
  if (schema) flow.schema = schema;
  return flow;
}
