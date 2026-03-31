# Package: @player-ui/player

## Overview

Core runtime engine that executes Player UI flows. Orchestrates data management, navigation state machines, view rendering, validation, and expression evaluation through a plugin-based architecture. Provides headless execution — no UI rendering, just flow logic and state management. Platform renderers (React, iOS, Android) consume Player's state to render UIs. For Flow JSON structure, binding/expression syntax, schema, and validation rule definitions, see `@player-ui/types`.

## Core Concepts

### Player Class

Main entry point and orchestrator. Manages flow lifecycle from start to completion. Provides hook system (Tapable) for extensibility. Instantiate once, start flows multiple times. Stateless between flows — each `start()` call creates fresh controllers.

**Lifecycle**: not-started → in-progress (controllers available) → completed/error

### Controllers (Separation of Concerns)

Seven specialized controllers manage distinct responsibilities:

- **DataController**: Manages data model with get/set/delete operations. Supports formatted vs raw values, middleware pipeline, reactive updates
- **FlowController**: Executes navigation state machine. Handles state transitions, subflow invocation, flow stack management. Owns FlowInstance per navigation flow
- **ViewController**: Manages view rendering and updates. Resolves view AST via plugin pipeline, tracks binding dependencies for reactive re-resolution
- **ValidationController**: Multi-phase validation system. Coordinates schema validations and cross-field rules, manages validation triggers (see `@player-ui/types` for trigger/severity/blocking semantics)
- **SchemaController**: Central registry for data types, formatters, and validators. Provides type information for bindings
- **ExpressionEvaluator**: Parses and evaluates the Player expression language. Manages custom functions, operators, and temporary variables
- **BindingParser**: Parses raw binding strings/arrays into `BindingInstance` objects. Handles dynamic segments via data model lookups and expression evaluation

All controllers accessible during InProgressState via `state.controllers`.

**Hook Firing Order** (during `start()`):

`flowController → bindingParser → schema → validationController → expressionEvaluator → dataController → viewController`

This is the order hooks fire, which is what matters for plugins: taps on later hooks can safely reference controllers from earlier hooks. Note that DataController is _created_ before ExpressionEvaluator, but `hooks.dataController` fires _after_ `hooks.expressionEvaluator`. This means a plugin tapping `dataController` can safely use the expression evaluator, but not vice versa.

**Controller Lifecycle:**

- Created when `start(flow)` called, as part of InProgressState transition
- Exist for duration of single flow execution; all share same data model instance
- Released on CompletedState or ErrorState — NOT reused between flows

**Safe Access Pattern:**

```typescript
const state = player.getState();
if (state.status === "in-progress") {
  const data = state.controllers.data;
  data.set([["user.name", "John"]]);
}
```

Never store controller references across flows. Always get fresh reference via `getState()`.

### Plugin System (Tapable Hooks)

Plugins extend Player by tapping into 12+ hook points. Plugins register during Player construction, apply via `apply(player)` method.

**Plugin Interface:**

```typescript
interface PlayerPlugin {
  symbol?: symbol;
  name: string;
  apply: (player: Player) => void;
}
```

Plugins applied in array order during construction. Later plugins can wrap/override earlier plugins' behavior. Hook tap order determines execution order.

**Conflict Resolution:**

| Mechanism            | Behavior                                                                 |
| -------------------- | ------------------------------------------------------------------------ |
| Expression functions | Last registration wins (same name)                                       |
| Validators           | Last registration wins (same type)                                       |
| Data middleware      | All execute in pipeline order (compose)                                  |
| Formatters           | Last registration wins (same type)                                       |
| Hook taps            | Execute in tap order; waterfall hooks pass modified values through chain |

**Anti-patterns:** Plugins with circular dependencies. Plugins modifying Player state outside hooks. Registering same validator/expression name multiple times unintentionally.

### State Machine (Flow Execution)

Player maintains explicit state through `getState()`:

- **NotStartedState**: Initial state, no flow loaded
- **InProgressState**: Flow executing, controllers available. Also exposes:
  - `controllers` — all seven controllers (see above)
  - `flow` — the original Flow JSON
  - `flowResult` — `Promise<FlowResult>` that resolves on completion
  - `fail(error: Error)` — abort the flow from the host platform
  - `logger` — Logger instance for the current player
- **CompletedState**: Flow finished successfully. Extends `FlowResult`:
  - `data` — serialized final data model (from `DataController.serialize()`)
  - `endState` — `NavigationFlowEndState` with `outcome` string
  - `controllers.data` — `ReadOnlyDataController` (reads still work; `set`/`delete` log errors and no-op)
  - `flow` — the original Flow JSON
- **ErrorState**: Flow failed with error (`error` property)

State transitions fire hooks — use `hooks.state` to observe. Each flow gets unique ref symbol for tracking.

### Data Model (Reactive with Middleware)

Centralized data storage with binding-based access (see `@player-ui/types` for binding syntax). Supports:

- **Middleware pipeline**: Intercept get/set/delete operations via `DataModelMiddleware`
- **Formatted vs raw values**: Display transformation separate from storage
- **Default values**: Returned on `get()` when value is undefined (from schema `default`). Not written to model on read; written silently only when a binding is first tracked by the validation system during view load
- **Validation integration**: Schema controller validates during set operations
- **Update batching**: Multiple sets fire single update event

Changes propagate to view automatically via binding subscription.

### View Resolution (AST Processing)

Views parsed as Abstract Syntax Tree processed by a plugin pipeline (execution order matters):

`AssetPlugin → SwitchPlugin → ApplicabilityPlugin → AssetTransformCorePlugin → StringResolverPlugin → TemplatePlugin → MultiNodePlugin`

View updates triggered by binding changes — only affected nodes re-resolve. String resolver handles `{{binding}}` and `@[expression]@` interpolation in string values.

**ViewPlugin Interface:**

```typescript
interface ViewPlugin {
  apply(view: ViewInstance): void;
}
```

ViewPlugins tap into Parser hooks (`onParseObject`, `onCreateASTNode`, `parseNode`) and Resolver hooks (`beforeResolve`, `resolve`, `afterResolve`, `skipResolve`, `beforeUpdate`, `afterUpdate`, `afterNodeUpdate`).

### Expression Evaluator

Executes expressions defined in `@player-ui/types`. Runtime adds custom function registration, temporary variable management (`setExpressionVariable`/`getExpressionVariable` — cleared on each `afterTransition`), and async evaluation. Variables are reset after each navigation transition. Expressions can also assign directly to bindings (`{{path}} = value`) or use modification operators (`{{count}} += 1`).

**Built-in Expression Functions** (baked into ExpressionEvaluator):

| Function                                    | Purpose                                              |
| ------------------------------------------- | ---------------------------------------------------- |
| `setDataVal(binding, value)`                | Write to data model                                  |
| `getDataVal(binding)`                       | Read from data model                                 |
| `deleteDataVal(binding)`                    | Delete from data model                               |
| `conditional(cond, trueVal, falseVal)`      | Ternary helper (lazy — only evaluates chosen branch) |
| `waitFor(expression)` / `await(expression)` | Wrap async result as Awaitable (async context only)  |

**Functions from DefaultExpPlugin:**

| Function                    | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `format(value, formatName)` | Format a value using a named formatter from SchemaController |
| `log(...)`                  | Log args via player logger (info level)                      |
| `debug(...)`                | Log args via player logger (debug level)                     |
| `eval(expression)`          | Evaluate a nested expression string                          |

**FlowExpPlugin** does not register expression functions — it evaluates flow-level `onStart`/`onEnd` lifecycle expressions and state-level `onStart` expressions. State-level `onEnd` expressions are evaluated by the Player core (in `player.ts`, inside the `beforeTransition` tap).

**Built-in Operators**: Arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `>`, `>=`, `<`, `<=`, `===`, `!==`), logical (`&&`, `||`, `!`), bitwise (`&`, `|`), unary (`-` negation, `+` numeric coercion, `!` logical not), assignment (`+=`, `-=`, `&=`, `|=`). Ternary (`? :`) also supported. Expressions can assign to bindings: `{{foo.bar}} = 42` or `{{count}} += 1`.

### Logger

Player accepts an optional `logger` in config options. Exported logger implementations:

- **TapableLogger**: Hook-based logger used internally, allows tapping into log events
- **ConsoleLogger**: Writes to console
- **ProxyLogger**: Delegates to another logger (useful for late binding)
- **NoopLogger**: Discards all output

## API Surface

### Player Class

**Constructor**:

```typescript
new Player(config?: {
  plugins?: PlayerPlugin[];
  logger?: Logger;
})
```

**Static Properties**: `Player.info: { version: string, commit: string }`

**Instance Methods**:

- `start(flow: Flow): Promise<CompletedState>` — Execute flow, returns when complete
- `getState(): PlayerFlowState` — Current execution state
- `getPlugins(): PlayerPlugin[]` — List registered plugins
- `findPlugin<T>(symbol: symbol): T | undefined` — Find plugin by symbol
- `applyTo<T>(symbol, apply: (plugin: T) => void)` — Conditionally apply to plugin
- `registerPlugin(plugin: PlayerPlugin)` — Add plugin dynamically (post-construction)

**Hooks** (via `player.hooks`):

| Hook                   | Type              | Purpose                           |
| ---------------------- | ----------------- | --------------------------------- |
| `flowController`       | SyncHook          | FlowController created            |
| `viewController`       | SyncHook          | ViewController created            |
| `view`                 | SyncHook          | New ViewInstance resolved         |
| `expressionEvaluator`  | SyncHook          | ExpressionEvaluator created       |
| `dataController`       | SyncHook          | DataController created            |
| `schema`               | SyncHook          | SchemaController created          |
| `validationController` | SyncHook          | ValidationController created      |
| `bindingParser`        | SyncHook          | BindingParser created             |
| `state`                | SyncHook          | State transition occurred         |
| `onStart`              | SyncHook          | Flow started                      |
| `onEnd`                | SyncHook          | Flow ended                        |
| `resolveFlowContent`   | SyncWaterfallHook | Mutate flow JSON before execution |

### DataController

**Key Methods**:

- `get(binding: BindingLike, options?: DataModelOptions): any` — Read data
- `set(transaction: RawSetTransaction, options?: DataModelOptions): Updates` — Write data (batch)
- `delete(binding: BindingLike, options?: DataModelOptions): void` — Remove data
- `serialize(): object` — Export current data model
- `makeReadOnly(): ReadOnlyDataController` — Returns a read-only wrapper (reads work; set/delete log errors and no-op)

**DataModelOptions**:

- `formatted?: boolean` — Get/set formatted values (vs raw)
- `includeInvalid?: boolean` — Include data failing validation
- `ignoreDefaultValue?: boolean` — Don't auto-populate defaults
- `silent?: boolean` — Defer view update scheduling (bindings merge into pending updates but no microtask is scheduled; next non-silent update includes them)

**Transaction formats**:

- Array: `[["binding1", value1], ["binding2", value2]]`
- Object: `{ binding1: value1, binding2: value2 }`

**Hooks**: `resolveDefaultValue`, `format`, `deformat`, `serialize`, `onSet`, `onGet`, `onDelete`, `onUpdate`, `resolve`, `resolveDataStages`

### FlowController

**Key Properties**:

- `current?: FlowInstance` — The currently active FlowInstance

**Key Methods**:

- `start(): Promise<NavigationFlowEndState>` — Begin flow state machine from `navigation.BEGIN`
- `transition(stateTransition: string, options?: TransitionOptions): void` — Navigate to next state

**TransitionOptions**:

- `force?: boolean` — Bypass `skipTransition` hook (skips validation checks). Use for programmatic navigation that must succeed.

**Hooks**: `flow` (SyncHook — fires when new FlowInstance created)

Manages navigation stack for nested flows. Automatically handles FLOW state type (subflows).

**Navigation State Types**:

| State Type     | Behavior                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| `VIEW`         | Renders a view (`ref` → view id). User interaction triggers transitions.                  |
| `END`          | Terminal state with `outcome` string. Resolves the flow promise.                          |
| `ACTION`       | Evaluates `exp` synchronously; return value selects a key in `transitions`                |
| `ASYNC_ACTION` | Evaluates `exp` asynchronously; with `await: true`, waits for result before transitioning |
| `FLOW`         | Invokes a sub-flow by `ref`; child flow's END `outcome` selects the parent transition     |
| `EXTERNAL`     | Defers to the host platform for transition resolution                                     |

**Wildcard Transitions**: If no specific transition key matches, `"*"` is used as fallback. Always define `"*"` as a catch-all when the exact transition values are unknown.

**Lifecycle Expressions**: Navigation flows support `onStart` and `onEnd` expressions (evaluated by `FlowExpPlugin`). Individual states also support `onStart` (evaluated when entering the state via `resolveTransitionNode`) and `onEnd` (evaluated when leaving via `beforeTransition`).

### FlowInstance

Each navigation flow gets a FlowInstance. Access via `flowController.current` or through `flowController.hooks.flow`.

**Key Properties**:

- `id: string` — The flow identifier (key from `navigation`)
- `currentState?: NamedState` — Current state (`{ name: string, value: NavigationFlowState }`)

**Key Methods**:

- `start(): Promise<NavigationFlowEndState>` — Start the state machine
- `transition(transitionValue: string, options?: TransitionOptions): void` — Trigger a transition

Critical hooks for controlling navigation:

| Hook                    | Type              | Purpose                                                     |
| ----------------------- | ----------------- | ----------------------------------------------------------- |
| `skipTransition`        | SyncBailHook      | Block transition (return true to skip) — used by validation |
| `beforeTransition`      | SyncWaterfallHook | Transform target state before transition                    |
| `resolveTransitionNode` | SyncWaterfallHook | Transform resolved transition node                          |
| `transition`            | SyncHook          | After transition completes                                  |
| `afterTransition`       | SyncHook          | Post-transition side effects (e.g., action execution)       |
| `onStart` / `onEnd`     | SyncHook          | Flow instance lifecycle                                     |
| `beforeStart`           | SyncBailHook      | Transform flow before start                                 |

Access via FlowController hook:

```typescript
player.hooks.flowController.tap("my-plugin", (flowController) => {
  flowController.hooks.flow.tap("my-plugin", (flowInstance) => {
    flowInstance.hooks.skipTransition.tap("my-plugin", (from, to) => {
      // Return true to block this transition
    });
  });
});
```

### ViewController

**Key Properties**:

- `currentView?: ViewInstance` — Currently rendered view
- `transformRegistry` — Asset transform registry

**Key Methods**:

- `onView(state: NavigationFlowViewState): void` — Render new view
- `updateViewAST(nodes: Set<Node.Node>): void` — Manual view update

**Hooks**: `resolveView` (SyncWaterfallHook), `view` (SyncHook)

View updates happen automatically on data changes via binding subscription.

### ValidationController

**Key Methods**:

- `validateView(trigger: Validation.Trigger): void` — Validate current view
- `forView(parser: BindingFactory): Resolve.Validation` — Get validation interface for view
- `getDataMiddleware(): Array<DataModelMiddleware>` — Middleware that validates on set

**Hooks**: `createValidatorRegistry`, `onAddValidation`, `onRemoveValidation`, `resolveValidationProviders`, `onTrackBinding`

Integrates with SchemaController for type-based validations and View for cross-field validations.

### SchemaController

**Key Methods**:

- `getType(binding: BindingInstance): Schema.DataTypes | undefined` — Get type definition
- `getApparentType(binding): Schema.DataTypes | undefined` — Type with base type merged
- `getFormatter(binding): FormatDefinition | undefined` — Get formatter for binding
- `getFormatterForType(ref: Formatting.Reference)` — Get formatter by ref
- `addFormatters(fns: Array<FormatType>)` — Register formatters
- `addDataTypes(types: Array<Schema.DataType>)` — Register data types

**Hooks**: `resolveTypeForBinding` (SyncWaterfallHook)

### BindingInstance

Immutable runtime representation of a binding path (see `@player-ui/types` for binding syntax).

**Key Methods**:

- `asArray(): RawBindingSegment[]` — Array representation
- `asString(): string` — String representation
- `contains(binding): boolean` — Check if binding is sub-path
- `parent(): BindingInstance` — Get parent binding
- `key(): RawBindingSegment` — Get last segment
- `descendent(relative): BindingInstance` — Navigate down path
- `relative(binding): RawBindingSegment[]` — Relative path to another binding

All operations return new instances (immutable).

### BindingParser

- `parse(rawBinding: BindingLike, options?): BindingInstance` — Parse string/array to BindingInstance

**Hooks**: `skipOptimization` (SyncBailHook), `beforeResolveNode` (SyncWaterfallHook)

### ExpressionEvaluator

**Key Methods**:

- `evaluate(exp: ExpressionType, options?): any` — Sync evaluation
- `evaluateAsync(exp: ExpressionType, options?): Promise<any>` — Async evaluation
- `addExpressionFunction(name: string, handler: ExpressionHandler)` — Register custom function
- `addBinaryOperator(op: string, handler: BinaryOperator)` — Register binary operator
- `addUnaryOperator(op: string, handler: UnaryOperator)` — Register unary operator
- `setExpressionVariable(name: string, value: any)` — Set temporary variable
- `getExpressionVariable(name: string): any` — Get temporary variable
- `reset(): void` — Clear parsed expression AST cache

**Hooks**: `resolve`, `resolveOptions`, `beforeEvaluate` (all SyncWaterfallHook), `onError` (SyncBailHook — return true to swallow error)

**ExpressionHandler signature**: `(context: ExpressionContext, ...args) => R` with optional `resolveParams: boolean`

### ConstantsController

Available on `player.constantsController` (persists across flows, unlike other controllers). Provides shared constants accessible to validation, view resolution, and other subsystems. Useful for injecting environment-level values that don't belong in flow data.

## Common Usage Patterns

### Starting a Flow

```typescript
const player = new Player({ plugins: [myPlugin] });
player.hooks.state.tap("my-app", (state) => {
  if (state.status === "in-progress") {
    // Access state.controllers.data, .flow, .view, .schema, .validation,
    // .expression, .binding
  }
});
const result = await player.start(flowJSON);
// result is CompletedState:
//   result.data — serialized final data model
//   result.endState.outcome — the END state outcome string
//   result.controllers.data.get("user.name") — read-only data access
```

Controllers only available during in-progress. Don't access before flow starts.

### Creating Plugins

```typescript
const myPlugin: PlayerPlugin = {
  symbol: Symbol("my-plugin"),
  name: "MyPlugin",
  apply: (player) => {
    player.hooks.dataController.tap("my-plugin", (dataController) => {
      dataController.hooks.onUpdate.tap("my-plugin", (updates) => {
        // React to data changes
      });
    });
  },
};
```

Use symbols for plugin retrieval via `player.findPlugin(myPlugin.symbol)`.

### Working with DataController

Access via `state.controllers.data` during InProgressState.

- **Raw** (default): What's stored in model (e.g., phone number digits)
- **Formatted**: What user sees (e.g., "(555) 123-4567") — pass `{ formatted: true }`

```typescript
data.set([
  ["user.name", "John"],
  ["user.age", 30],
]);
const name = data.get("user.name"); // raw value
const phone = data.get("user.phone", { formatted: true }); // formatted
```

Setting formatted values requires a deformatter registered in SchemaController.

### Custom Expression Functions

```typescript
player.hooks.expressionEvaluator.tap("custom", (evaluator) => {
  evaluator.addExpressionFunction("toUpperCase", (context, value) =>
    String(value).toUpperCase(),
  );
});
// In flow JSON: "@[toUpperCase(@user.name@)]@"
```

Async functions need special handling. Handler receives `(context: ExpressionContext, ...args)`.

### Custom Validators

```typescript
player.hooks.validationController.tap("validators", (validation) => {
  validation.hooks.createValidatorRegistry.tap("validators", (registry) => {
    registry.register("email", (context, value) => {
      if (!value?.includes("@")) {
        return { message: "Invalid email format" };
      }
    });
  });
});
```

Validators run based on trigger defined in schema (see `@player-ui/types` for trigger/severity/blocking semantics).

### Transforming Flow Content Before Execution

```typescript
player.hooks.resolveFlowContent.tap("my-plugin", (flow) => {
  // Modify flow JSON before controllers are created
  return { ...flow, data: { ...flow.data, injected: true } };
});
```

This waterfall hook runs before controller creation — useful for injecting data, modifying navigation, or rewriting views.

## Dependencies

- **@player-ui/types**: Type definitions for all Player concepts (auto-included by MCP dependency resolution)
- **@player-ui/partial-match-registry**: Asset transform registry (Registry class)
- **@player-ui/make-flow**: Flow construction utilities
- **tapable-ts**: Hook system (SyncHook, SyncWaterfallHook, SyncBailHook)
- **timm**: Immutable object operations (setIn, getIn)
- **dequal**: Deep equality checks

## Integration Points

### Hook System

12+ hook points for extension. Controller hooks fire in a specific order during `start()` (see Hook Firing Order above). Hooks use Tapable patterns:

- **SyncHook**: Fire-and-forget notification
- **SyncWaterfallHook**: Each tap transforms and passes value to next
- **SyncBailHook**: First tap returning non-undefined value short-circuits

### Middleware System

Data model supports `DataModelMiddleware` for intercepting get/set/delete. Middleware composes as a pipeline — all registered middleware executes in order. `ValidationMiddleware` is built-in (shadow model for invalid values). Custom middleware via `PipelinedDataModel.addMiddleware()`.

## Common Pitfalls

1. **Accessing controllers before InProgressState**: State is NotStarted until `start()` called. Check `status === "in-progress"` first.

2. **Formatted vs raw value confusion**: `data.get(binding)` returns raw by default. Use `{ formatted: true }` for display values. Setting formatted requires deformatter.

3. **Plugin registration timing**: Plugins registered in constructor apply in order. Dynamic registration via `registerPlugin()` applies immediately but misses already-fired hooks.

4. **BindingInstance immutability**: Operations like `parent()`, `descendent()` return new instances — they don't mutate.

5. **View updates during silent sets**: `data.set(transaction, { silent: true })` defers (not skips) view updates — changed bindings accumulate and resolve on the next non-silent update. Use for intermediate calculations only.

6. **Navigation transition errors**: Calling `transition()` before flow starts or after completion throws. Ensure FlowController has an active flow.

7. **Hook tap order matters**: Earlier taps run first. Waterfall hooks pass modified values through chain. Bail hooks stop at first non-undefined return.

8. **State ref uniqueness**: Each flow execution gets unique ref symbol. Don't compare states across flows by ref.

9. **resolveFlowContent is a waterfall**: Must return the (potentially modified) flow object. Forgetting to return breaks the chain.

## Debugging Patterns

Tap into controller hooks to observe runtime behavior:

| Debug Goal        | Hook Path                                  | Callback Args                  |
| ----------------- | ------------------------------------------ | ------------------------------ |
| Expression errors | `expressionEvaluator` → `onError`          | `(error, expression)`          |
| Binding reads     | `dataController` → `onGet`                 | `(binding, value)`             |
| Data writes       | `dataController` → `onSet`                 | `(updates)`                    |
| State changes     | `state`                                    | `(playerFlowState)`            |
| Navigation        | `flowController` → `flow` → `transition`   | `(prevState, newCurrentState)` |
| Validation        | `validationController` → `onAddValidation` | `(validation)`                 |

**Canonical tap pattern:**

```typescript
player.hooks.dataController.tap("debug", (dc) => {
  dc.hooks.onSet.tap("debug", (updates) => {
    console.log("Data updated:", updates);
  });
});
```

**Inspecting state at runtime:**

- `state.controllers.data.serialize()` — Current data model snapshot
- `state.controllers.view.currentView` — Current view AST
- `state.controllers.flow` — Current navigation state

## Reference Files

- `/core/player/src/player.ts` — Main Player class
- `/core/player/src/types.ts` — Player state types (NotStartedState, InProgressState, etc.)
- `/core/player/src/controllers/data/controller.ts` — DataController
- `/core/player/src/controllers/flow/controller.ts` — FlowController
- `/core/player/src/controllers/flow/flow.ts` — FlowInstance and its hooks
- `/core/player/src/controllers/view/controller.ts` — ViewController
- `/core/player/src/controllers/validation/controller.ts` — ValidationController
- `/core/player/src/schema/schema.ts` — SchemaController
- `/core/player/src/binding/binding.ts` — BindingInstance and BindingParser
- `/core/player/src/expressions/evaluator.ts` — ExpressionEvaluator
- `/core/player/src/view/view.ts` — ViewInstance and ViewPlugin
- `/core/player/src/data/index.ts` — Data model middleware system
- `/core/player/src/string-resolver/index.ts` — String binding/expression resolution
- `/core/player/src/plugins/default-exp-plugin.ts` — DefaultExpPlugin (built-in: format, log, debug, eval)
- `/core/player/src/plugins/flow-exp-plugin.ts` — FlowExpPlugin (built-in: flow/state lifecycle expressions)
- `/core/player/src/expressions/evaluator-functions.ts` — Default expression functions (setDataVal, getDataVal, etc.)
- `/core/player/src/controllers/data/utils.ts` — ReadOnlyDataController

## Performance Considerations

- **Binding parsing**: Cached per BindingParser instance. Reuse parser for efficiency.
- **View updates**: Only affected nodes re-resolve. Binding subscription tracks dependencies automatically.
- **Data middleware**: Pipeline runs on every get/set. Keep middleware fast.
- **Validation timing**: Use "navigation" trigger for expensive validations to avoid change-triggered overhead.
