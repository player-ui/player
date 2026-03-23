---
name: Player Hooks Guide
description: Use when the user asks about Player UI hooks, what hooks are available, how to tap into Player, or needs a reference for the hook system. Covers all hook surfaces, tapable-ts patterns, and when to use each hook.
version: "2.0"
---

# Player Hooks Guide

The Player hook system is built on `tapable-ts`. Plugins receive the Player instance via `apply(player)` and tap hooks to extend behavior.

---

## Hook Basics

```typescript
import type { Player, PlayerPlugin } from "@player-ui/player";

class MyPlugin implements PlayerPlugin {
  name = "MyPlugin";

  apply(player: Player): void {
    // Always use this.name as the tap identifier
    player.hooks.state.tap(this.name, (state) => {
      /* ... */
    });
  }
}
```

**Rule:** Always pass `this.name` as the first argument to `.tap()`. This identifies your plugin in debugging and allows ordering.

---

## Top-Level Player Hooks

| Hook                   | Tapable Type                       | Fires When                    | Common Use                               |
| ---------------------- | ---------------------------------- | ----------------------------- | ---------------------------------------- |
| `state`                | `SyncHook<[PlayerFlowState]>`      | Every state transition        | Gate logic on `status === "in-progress"` |
| `flowController`       | `SyncHook<[FlowController]>`       | Flow controller created       | Capture reference for `transition()`     |
| `viewController`       | `SyncHook<[ViewController]>`       | View controller created       | Tap into view lifecycle                  |
| `view`                 | `SyncHook<[ViewInstance]>`         | Each new view                 | React to view changes                    |
| `expressionEvaluator`  | `SyncHook<[ExpressionEvaluator]>`  | Evaluator created             | Register custom expression functions     |
| `dataController`       | `SyncHook<[DataController]>`       | Data controller ready         | Tap format/deformat pipeline             |
| `schema`               | `SyncHook<[SchemaController]>`     | Schema loaded                 | Extend type schema                       |
| `validationController` | `SyncHook<[ValidationController]>` | Validation controller ready   | Add custom validators                    |
| `bindingParser`        | `SyncHook<[BindingParser]>`        | Parser created                | Custom binding syntax                    |
| `onStart`              | `SyncHook<[Flow]>`                 | After flow controller created | Inspect resolved flow content            |
| `onEnd`                | `SyncHook<[]>`                     | Flow completes or fails       | Cleanup resources                        |
| `resolveFlowContent`   | `SyncWaterfallHook<[Flow]>`        | Content resolution            | Transform flow JSON before processing    |

---

## ViewController Hooks

Access via `player.hooks.viewController`:

| Hook          | Tapable Type                                                              | Fires When                    | Common Use                        |
| ------------- | ------------------------------------------------------------------------- | ----------------------------- | --------------------------------- |
| `resolveView` | `SyncWaterfallHook<[View \| undefined, string, NavigationFlowViewState]>` | Before `ViewInstance` created | Transform or replace view content |
| `view`        | `SyncHook<[ViewInstance]>`                                                | After `ViewInstance` created  | Tap into view-level hooks         |

```typescript
player.hooks.viewController.tap(this.name, (vc) => {
  vc.hooks.resolveView.tap(this.name, (view, viewId, state) => {
    // Transform view content before ViewInstance is constructed
    return view;
  });

  vc.hooks.view.tap(this.name, (view) => {
    // view is a ViewInstance — tap its hooks here
  });
});
```

---

## View Hooks

Access via the view instance inside `vc.hooks.view`:

| Hook             | Tapable Type                 | Fires When                   | Common Use                               |
| ---------------- | ---------------------------- | ---------------------------- | ---------------------------------------- |
| `onUpdate`       | `SyncHook<[ViewType]>`       | View content changes         | Track current view, fire beacons         |
| `parser`         | `SyncHook<[Parser]>`         | Parser created for this view | Tap parser hooks to modify AST           |
| `resolver`       | `SyncHook<[Resolver]>`       | Resolver created for view    | Tap resolver hooks for custom resolution |
| `templatePlugin` | `SyncHook<[TemplatePlugin]>` | Template plugin created      | Custom template handling                 |

```typescript
view.hooks.onUpdate.tap(this.name, (updatedView) => {
  // updatedView is the resolved View object
});

view.hooks.resolver.tap(this.name, (resolver) => {
  resolver.hooks.afterResolve.tap(this.name, (value, node, options) => {
    // Transform resolved values after children are resolved
    return value;
  });
});
```

---

## Parser Hooks

Access via `view.hooks.parser`. The `Parser` instance has three hooks for controlling how view JSON is transformed into the AST:

| Hook              | Tapable Type                                                                            | Fires When              | Common Use                    |
| ----------------- | --------------------------------------------------------------------------------------- | ----------------------- | ----------------------------- |
| `onParseObject`   | `SyncWaterfallHook<[object, NodeType]>`                                                 | Before parsing into AST | Pre-process raw view objects  |
| `onCreateASTNode` | `SyncWaterfallHook<[Node.Node \| undefined \| null, object]>`                           | After AST node created  | Modify or replace AST nodes   |
| `parseNode`       | `SyncBailHook<[obj, nodeType, parseOptions, childOptions?], Node.Node \| Node.Child[]>` | During node parsing     | Override default node parsing |

```typescript
view.hooks.parser.tap(this.name, (parser) => {
  parser.hooks.onParseObject.tap(this.name, (obj, nodeType) => {
    // Transform the raw object before it becomes an AST node
    return obj;
  });

  parser.hooks.onCreateASTNode.tap(this.name, (node, sourceObj) => {
    // Modify the AST node after creation; return value replaces node
    return node;
  });
});
```

---

## Resolver Hooks

Access via `view.hooks.resolver`. The `Resolver` controls how AST nodes are resolved to their final values:

| Hook              | Tapable Type                                                  | Fires When                       |
| ----------------- | ------------------------------------------------------------- | -------------------------------- |
| `beforeResolve`   | `SyncWaterfallHook<[Node.Node \| null, NodeResolveOptions]>`  | Before resolving a node          |
| `resolve`         | `SyncWaterfallHook<[any, Node.Node, NodeResolveOptions]>`     | Resolving node (before children) |
| `afterResolve`    | `SyncWaterfallHook<[any, Node.Node, NodeResolveOptions]>`     | After children are resolved      |
| `skipResolve`     | `SyncWaterfallHook<[boolean, Node.Node, NodeResolveOptions]>` | Check if node should be skipped  |
| `resolveOptions`  | `SyncWaterfallHook<[NodeResolveOptions, Node.Node]>`          | Customize per-node options       |
| `beforeUpdate`    | `SyncHook<[Set<BindingInstance> \| undefined]>`               | Before calculating an update     |
| `afterUpdate`     | `SyncHook<[any]>`                                             | After calculating an update      |
| `afterNodeUpdate` | `SyncHook<[Node.Node, Node.Node \| undefined, NodeUpdate]>`   | After a node tree is updated     |

---

## Accessing Controllers

Controllers are **only** available when `state.status === "in-progress"`:

```typescript
player.hooks.state.tap(this.name, (state) => {
  if (state.status !== "in-progress") return;

  const { controllers } = state;
  // controllers.data      — DataController
  // controllers.flow      — FlowController
  // controllers.view      — ViewController
  // controllers.schema    — SchemaController
  // controllers.binding   — BindingParser
  // controllers.validation — ValidationController
  // controllers.expression — ExpressionEvaluator
});
```

**Never store controller references across flows.** Always get a fresh reference via `player.getState()`.

---

## Tapable-ts Hook Types

**Sync hooks** — all taps run synchronously:

| Type                     | Behavior                                     | When to Use                    |
| ------------------------ | -------------------------------------------- | ------------------------------ |
| `SyncHook<[T]>`          | All taps run, no return value                | Side effects, registrations    |
| `SyncWaterfallHook<[T]>` | Each tap receives and can modify the value   | Pipeline transformations       |
| `SyncBailHook<[T], R>`   | Stops when any tap returns non-undefined     | "First handler wins" overrides |
| `SyncLoopHook<[T]>`      | Re-runs taps while any returns non-undefined | Retry/convergence loops        |

**Async hooks** — taps can return promises:

| Type                            | Behavior                                          | When to Use                    |
| ------------------------------- | ------------------------------------------------- | ------------------------------ |
| `AsyncParallelHook<[T]>`        | All taps run in parallel                          | Independent async side effects |
| `AsyncParallelBailHook<[T], R>` | Parallel with early bail on non-undefined         | Parallel with short-circuit    |
| `AsyncSeriesHook<[T]>`          | Taps run sequentially                             | Ordered async side effects     |
| `AsyncSeriesBailHook<[T], R>`   | Sequential with bail                              | Sequential with short-circuit  |
| `AsyncSeriesWaterfallHook<[T]>` | Sequential, each tap can modify the value         | Async pipeline transformations |
| `AsyncSeriesLoopHook<[T]>`      | Sequential re-run while any returns non-undefined | Async retry/convergence        |

```typescript
import { SyncHook, SyncWaterfallHook, SyncBailHook } from "tapable-ts";

public hooks = {
  // SyncWaterfallHook — each tap can transform the value
  transformData: new SyncWaterfallHook<[Record<string, unknown>]>(),

  // SyncBailHook — return a value to stop further taps
  shouldCancel: new SyncBailHook<[EventArgs], boolean>(),
};
```

---

## Registering Custom Expressions

The handler's first argument is an `ExpressionContext`; remaining arguments come from the flow JSON call:

```typescript
player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
  evaluator.addExpressionFunction("myFunction", (ctx, value, multiplier) => {
    if (typeof value !== "number" || typeof multiplier !== "number") return 0;
    return value * multiplier;
  });
});
```

In flow JSON: `"@[myFunction(3, 4)]@"` resolves to `12`.

---

## Registering Custom Validators

Register validators by tapping the `createValidatorRegistry` hook on the `ValidationController`:

```typescript
player.hooks.validationController.tap(this.name, (validation) => {
  validation.hooks.createValidatorRegistry.tap(this.name, (registry) => {
    registry.register("email", (_ctx, value) => {
      if (typeof value !== "string" || !value.includes("@")) {
        return { message: "Invalid email format" };
      }
      return undefined;
    });
  });
});
```

---

## DataController Hooks

Access via `player.hooks.dataController`:

| Hook                  | Tapable Type                                         | Fires When                           |
| --------------------- | ---------------------------------------------------- | ------------------------------------ |
| `resolveDataStages`   | `SyncWaterfallHook<[DataPipeline]>`                  | Building the data model              |
| `resolveDefaultValue` | `SyncBailHook<[BindingInstance], any>`               | Getting an undefined value           |
| `onSet`               | `SyncHook<[BatchSetTransaction]>`                    | After data is set                    |
| `onGet`               | `SyncHook<[any, any]>`                               | After data is read                   |
| `onUpdate`            | `SyncHook<[Updates, DataModelOptions \| undefined]>` | After data updates propagate         |
| `onDelete`            | `SyncHook<[any]>`                                    | After data is deleted                |
| `format`              | `SyncWaterfallHook<[any, BindingInstance]>`          | Formatting a value for display       |
| `deformat`            | `SyncWaterfallHook<[any, BindingInstance]>`          | Deformatting a value from user input |
| `serialize`           | `SyncWaterfallHook<[any]>`                           | Serializing data for output          |

```typescript
player.hooks.dataController.tap(this.name, (dc) => {
  dc.hooks.format.tap(this.name, (value, binding) => {
    // Transform value for display (e.g., currency formatting)
    return value;
  });

  dc.hooks.deformat.tap(this.name, (value, binding) => {
    // Transform user input back to raw value
    return value;
  });
});
```

---

## ExpressionEvaluator Hooks

Access via `player.hooks.expressionEvaluator`. Beyond `addExpressionFunction`, the evaluator exposes hooks and additional registration methods:

| Hook             | Tapable Type                                            | Fires When                                 |
| ---------------- | ------------------------------------------------------- | ------------------------------------------ |
| `resolve`        | `SyncWaterfallHook<[any, ExpressionNode, HookOptions]>` | Resolving an expression AST node           |
| `resolveOptions` | `SyncWaterfallHook<[HookOptions]>`                      | Building resolve options                   |
| `beforeEvaluate` | `SyncWaterfallHook<[ExpressionType, HookOptions]>`      | Before expression is evaluated             |
| `onError`        | `SyncBailHook<[Error], true>`                           | Expression error (return `true` to handle) |

Additional registration methods on `ExpressionEvaluator`:

- `addExpressionFunction(name, handler)` — register a custom function
- `addBinaryOperator(name, handler)` — register a binary operator
- `addUnaryOperator(name, handler)` — register a unary operator
- `setExpressionVariable(name, value)` — set a variable accessible in expressions
- `getExpressionVariable(name)` — read a variable

---

## SchemaController Hooks

Access via `player.hooks.schema`:

| Hook                    | Tapable Type                                                  | Fires When                 |
| ----------------------- | ------------------------------------------------------------- | -------------------------- |
| `resolveTypeForBinding` | `SyncWaterfallHook<[DataType \| undefined, BindingInstance]>` | Resolving a binding's type |

---

## BindingParser Hooks

Access via `player.hooks.bindingParser`:

| Hook                | Tapable Type                                             | Fires When                                 |
| ------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `skipOptimization`  | `SyncBailHook<[string], boolean>`                        | Deciding whether to skip path optimization |
| `beforeResolveNode` | `SyncWaterfallHook<[AnyNode, BeforeResolveNodeContext]>` | Before resolving a binding node            |

---

## ValidationController Hooks

Access via `player.hooks.validationController`:

| Hook                         | Tapable Type                                               | Fires When                        |
| ---------------------------- | ---------------------------------------------------------- | --------------------------------- |
| `createValidatorRegistry`    | `SyncHook<[ValidatorRegistry]>`                            | Registry created (register here)  |
| `onAddValidation`            | `SyncWaterfallHook<[ValidationResponse, BindingInstance]>` | Validation added to a binding     |
| `onRemoveValidation`         | `SyncWaterfallHook<[ValidationResponse, BindingInstance]>` | Validation removed from a binding |
| `resolveValidationProviders` | `SyncWaterfallHook<[Array<{source, provider}>]>`           | Resolving validation providers    |
| `onTrackBinding`             | `SyncHook<[BindingInstance]>`                              | Binding added to tracker          |

---

## Per-Flow Hook Pattern

Many hooks fire once per `player.start()`. Avoid stale references:

```typescript
apply(player: Player): void {
  player.hooks.flowController.tap(this.name, (fc) => {
    fc.hooks.flow.tap(this.name, (flow) => {
      // Fresh FlowInstance reference each flow
    });
  });
}
```

---

## FlowInstance Hooks

The `FlowInstance` (received via `fc.hooks.flow`) exposes hooks for navigation lifecycle:

| Hook                    | Tapable Type                                                    | Fires When                         |
| ----------------------- | --------------------------------------------------------------- | ---------------------------------- |
| `beforeStart`           | `SyncBailHook<[NavigationFlow], NavigationFlow>`                | Before flow navigation starts      |
| `onStart`               | `SyncHook<[any]>`                                               | When the onStart node fires        |
| `onEnd`                 | `SyncHook<[any]>`                                               | When the onEnd node fires          |
| `skipTransition`        | `SyncBailHook<[NamedState \| undefined], boolean \| undefined>` | Return `true` to block transition  |
| `beforeTransition`      | `SyncWaterfallHook<[NavigationFlowState, string]>`              | Modify flow node before transition |
| `resolveTransitionNode` | `SyncWaterfallHook<[NavigationFlowState]>`                      | Modify resolved target node        |
| `transition`            | `SyncHook<[NamedState \| undefined, NamedState]>`               | After a state transition occurs    |
| `afterTransition`       | `SyncHook<[FlowInstance]>`                                      | Run actions after transition       |

```typescript
player.hooks.flowController.tap(this.name, (fc) => {
  fc.hooks.flow.tap(this.name, (flow) => {
    flow.hooks.beforeTransition.tap(this.name, (state, transitionValue) => {
      // Inspect or modify the target state before transitioning
      return state;
    });

    flow.hooks.skipTransition.tap(this.name, (currentState) => {
      // Return true to block this transition
      return undefined;
    });
  });
});
```

---

## Plugin-to-Plugin Hooks

Plugins can expose their own hooks for other plugins to tap:

```typescript
import { SyncHook } from "tapable-ts";

export class MyPlugin implements PlayerPlugin {
  name = "MyPlugin";
  static Symbol = Symbol("MyPlugin");
  public readonly symbol = MyPlugin.Symbol;

  public hooks = {
    onProcess: new SyncWaterfallHook<[ProcessData]>(),
  };

  apply(player: Player): void {
    /* ... */
  }
}

// Another plugin finds and taps it:
const myPlugin = player.findPlugin<MyPlugin>(MyPlugin.Symbol);
myPlugin?.hooks.onProcess.tap("ConsumerPlugin", (data) => {
  return { ...data, modified: true };
});
```

---

## React-Specific Hooks

When using `@player-ui/react`, ReactPlayer adds additional hooks:

| Hook                | Type                                                         | Purpose                          |
| ------------------- | ------------------------------------------------------------ | -------------------------------- |
| `webComponent`      | `SyncWaterfallHook<[React.ComponentType]>`                   | Wrap the entire player UI        |
| `playerComponent`   | `SyncWaterfallHook<[React.ComponentType<ReactPlayerProps>]>` | Wrap individual views            |
| `onBeforeViewReset` | `AsyncParallelHook<[]>`                                      | Async cleanup before view change |

```tsx
reactPlayer.hooks.webComponent.tap("MyWrapper", (Comp) => {
  return (props) => (
    <ThemeProvider>
      <Comp {...props} />
    </ThemeProvider>
  );
});
```
