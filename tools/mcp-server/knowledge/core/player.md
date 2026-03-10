# Package: @player-ui/player

## Overview

Core runtime engine that executes Player UI flows. Orchestrates data management, navigation state machines, view rendering, validation, and expression evaluation through a plugin-based architecture. Provides headless execution — no UI rendering, just flow logic and state management. Platform renderers (React, iOS, Android) consume Player's state to render UIs. For Flow JSON structure, binding/expression syntax, schema, and validation rule definitions, see `@player-ui/types`.

## Core Concepts

### Player Class

Main entry point and orchestrator. Manages flow lifecycle from start to completion. Provides hook system (Tapable) for extensibility. Instantiate once, start flows multiple times. Stateless between flows — each `start()` call creates fresh controllers.

**Lifecycle**: not-started → in-progress (controllers available) → completed/error

### Controllers (Separation of Concerns)

Five specialized controllers manage distinct responsibilities:

- **DataController**: Manages data model with get/set/delete operations. Supports formatted vs raw values, middleware pipeline, reactive updates
- **FlowController**: Executes navigation state machine. Handles state transitions, subflow invocation, flow stack management. Owns FlowInstance per navigation flow
- **ViewController**: Manages view rendering and updates. Resolves view AST via plugin pipeline, tracks binding dependencies for reactive re-resolution
- **ValidationController**: Multi-phase validation system. Coordinates schema validations and cross-field rules, manages validation triggers (see `@player-ui/types` for trigger/severity/blocking semantics)
- **SchemaController**: Central registry for data types, formatters, and validators. Provides type information for bindings

All controllers accessible during InProgressState via `state.controllers`.

**Controller Creation Order** (during `start()`):

`FlowController → BindingParser → SchemaController → ValidationController → DataController → ExpressionEvaluator → ViewController`

This order matters for plugins: taps on later controllers can safely reference earlier controllers (e.g., a DataController tap can use SchemaController).

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

| Mechanism | Behavior |
|---|---|
| Expression functions | Last registration wins (same name) |
| Validators | Last registration wins (same type) |
| Data middleware | All execute in pipeline order (compose) |
| Formatters | Last registration wins (same type) |
| Hook taps | Execute in tap order; waterfall hooks pass modified values through chain |

**Anti-patterns:** Plugins with circular dependencies. Plugins modifying Player state outside hooks. Registering same validator/expression name multiple times unintentionally.

### State Machine (Flow Execution)

Player maintains explicit state through `getState()`:

- **NotStartedState**: Initial state, no flow loaded
- **InProgressState**: Flow executing, controllers available
- **CompletedState**: Flow finished successfully, readonly data access
- **ErrorState**: Flow failed with error

State transitions fire hooks — use `hooks.state` to observe. Each flow gets unique ref symbol for tracking.

### Data Model (Reactive with Middleware)

Centralized data storage with binding-based access (see `@player-ui/types` for binding syntax). Supports:

- **Middleware pipeline**: Intercept get/set/delete operations via `DataModelMiddleware`
- **Formatted vs raw values**: Display transformation separate from storage
- **Default values**: Auto-populate on first read (side effect: writes to model)
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

Executes expressions defined in `@player-ui/types`. Runtime adds custom function registration, variable management, and async evaluation.

**Built-in Expression Functions** (registered by DefaultExpPlugin and FlowExpPlugin):

| Function | Purpose |
|---|---|
| `setDataVal(binding, value)` | Write to data model |
| `getDataVal(binding)` | Read from data model |
| `deleteDataVal(binding)` | Delete from data model |
| `conditional(cond, trueVal, falseVal)` | Ternary helper |
| `waitFor(expression)` | Await async expression |
| `format(binding)` | Get formatted value |
| `log(...)` / `debug(...)` | Console output |

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

| Hook | Type | Purpose |
|---|---|---|
| `flowController` | SyncHook | FlowController created |
| `viewController` | SyncHook | ViewController created |
| `view` | SyncHook | New ViewInstance resolved |
| `expressionEvaluator` | SyncHook | ExpressionEvaluator created |
| `dataController` | SyncHook | DataController created |
| `schema` | SyncHook | SchemaController created |
| `validationController` | SyncHook | ValidationController created |
| `bindingParser` | SyncHook | BindingParser created |
| `state` | SyncHook | State transition occurred |
| `onStart` | SyncHook | Flow started |
| `onEnd` | SyncHook | Flow ended |
| `resolveFlowContent` | SyncWaterfallHook | Mutate flow JSON before execution |

### DataController

**Key Methods**:

- `get(binding: BindingLike, options?: DataModelOptions): any` — Read data
- `set(transaction: RawSetTransaction, options?: DataModelOptions): Updates` — Write data (batch)
- `delete(binding: BindingLike, options?: DataModelOptions): void` — Remove data
- `serialize(): object` — Export current data model
- `makeReadOnly(): void` — Prevent further writes

**DataModelOptions**:

- `formatted?: boolean` — Get/set formatted values (vs raw)
- `includeInvalid?: boolean` — Include data failing validation
- `ignoreDefaultValue?: boolean` — Don't auto-populate defaults
- `silent?: boolean` — Skip view update notifications

**Transaction formats**:

- Array: `[["binding1", value1], ["binding2", value2]]`
- Object: `{ binding1: value1, binding2: value2 }`

**Hooks**: `resolveDefaultValue`, `format`, `deformat`, `serialize`, `onSet`, `onGet`, `onDelete`, `onUpdate`, `resolve`, `resolveDataStages`

### FlowController

**Key Methods**:

- `start(): Promise<NavigationFlowEndState>` — Begin flow state machine
- `transition(stateTransition: string, options?: TransitionOptions): void` — Navigate to state

**Hooks**: `flow` (SyncHook — fires when new FlowInstance created)

Manages navigation stack for nested flows. Automatically handles FLOW state type (subflows).

### FlowInstance

Each navigation flow gets a FlowInstance. Critical hooks for controlling navigation:

| Hook | Type | Purpose |
|---|---|---|
| `skipTransition` | SyncBailHook | Block transition (return true to skip) — used by validation |
| `beforeTransition` | SyncWaterfallHook | Transform target state before transition |
| `resolveTransitionNode` | SyncWaterfallHook | Transform resolved transition node |
| `transition` | SyncHook | After transition completes |
| `afterTransition` | SyncHook | Post-transition side effects (e.g., action execution) |
| `onStart` / `onEnd` | SyncHook | Flow instance lifecycle |
| `beforeStart` | SyncBailHook | Transform flow before start |

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
- `forView(parseBinding): ValidationResponse` — Get validation interface for view
- `getDataMiddleware(): DataModelMiddleware` — Middleware that validates on set

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
- `reset(): void` — Clear temporary variables

**Hooks**: `resolve`, `resolveOptions`, `beforeEvaluate` (all SyncWaterfallHook), `onError` (SyncBailHook — return true to swallow error)

**ExpressionHandler signature**: `(context: ExpressionContext, ...args) => R` with optional `resolveParams: boolean`

## Common Usage Patterns

### Starting a Flow

```typescript
const player = new Player({ plugins: [myPlugin] });
player.hooks.state.tap("my-app", (state) => {
  if (state.status === "in-progress") {
    // Access state.controllers.data, .flow, .view, .schema, .validation
  }
});
const result = await player.start(flowJSON);
// result is CompletedState with readonly data access
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

Setting formatted values requires a deformatter registered in SchemaController. `{ silent: true }` prevents view updates — use for intermediate calculations only.

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

12+ hook points for extension. Controller creation hooks fire in creation order (see above). Hooks use Tapable patterns:

- **SyncHook**: Fire-and-forget notification
- **SyncWaterfallHook**: Each tap transforms and passes value to next
- **SyncBailHook**: First tap returning non-undefined value short-circuits

### Controller Access

During InProgressState, access all controllers via `state.controllers`:

- `data` — DataController
- `flow` — FlowController
- `view` — ViewController
- `schema` — SchemaController
- `validation` — ValidationController
- `expression` — ExpressionEvaluator
- `binding` — BindingParser

### Middleware System

Data model supports `DataModelMiddleware` for intercepting get/set/delete. Middleware composes as a pipeline — all registered middleware executes in order. `ValidationMiddleware` is built-in (shadow model for invalid values). Custom middleware via `PipelinedDataModel.addMiddleware()`.

## Common Pitfalls

1. **Accessing controllers before InProgressState**: State is NotStarted until `start()` called. Check `status === "in-progress"` first.

2. **Formatted vs raw value confusion**: `data.get(binding)` returns raw by default. Use `{ formatted: true }` for display values. Setting formatted requires deformatter.

3. **Plugin registration timing**: Plugins registered in constructor apply in order. Dynamic registration via `registerPlugin()` applies immediately but misses already-fired hooks.

4. **BindingInstance immutability**: Operations like `parent()`, `descendent()` return new instances — they don't mutate.

5. **View updates during silent sets**: `data.set(transaction, { silent: true })` prevents view updates. Use for intermediate calculations only.

6. **Navigation transition errors**: Calling `transition()` before flow starts or after completion throws. Ensure FlowController has an active flow.

7. **Hook tap order matters**: Earlier taps run first. Waterfall hooks pass modified values through chain. Bail hooks stop at first non-undefined return.

8. **State ref uniqueness**: Each flow execution gets unique ref symbol. Don't compare states across flows by ref.

9. **resolveFlowContent is a waterfall**: Must return the (potentially modified) flow object. Forgetting to return breaks the chain.

## Debugging Patterns

Tap into controller hooks to observe runtime behavior:

| Debug Goal | Hook Path | Callback Args |
|---|---|---|
| Expression errors | `expressionEvaluator` → `onError` | `(error, expression)` |
| Binding reads | `dataController` → `onGet` | `(binding, value)` |
| Data writes | `dataController` → `onSet` | `(updates)` |
| State changes | `state` | `(playerFlowState)` |
| Navigation | `flowController` → `flow` → `transition` | `(to, from)` |
| Validation | `validationController` → `onAddValidation` | `(validation)` |

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
- `/core/player/src/plugins/flow-exp-plugin.ts` — FlowExpPlugin (built-in)

## Performance Considerations

- **Binding parsing**: Cached per BindingParser instance. Reuse parser for efficiency.
- **View updates**: Only affected nodes re-resolve. Binding subscription tracks dependencies automatically.
- **Data middleware**: Pipeline runs on every get/set. Keep middleware fast.
- **Validation timing**: Use "navigation" trigger for expensive validations to avoid change-triggered overhead.
