# Package: @player-ui/player

## Overview

Core runtime engine that executes Player UI flows. Orchestrates data management, navigation state machines, view rendering, validation, and expression evaluation through a plugin-based architecture. Provides headless execution, no UI rendering, just flow logic and state management. Platform renderers (React, iOS, Android) consume Player's state to render UIs.

## Core Concepts

### Player Class

Main entry point and orchestrator. Manages flow lifecycle from start to completion. Provides hook system (Tapable) for extensibility. Instantiate once, start flows multiple times. Stateless between flows—each `start()` call creates fresh controllers.

**Lifecycle**: not-started → in-progress (controllers available) → completed/error

### Controllers (Separation of Concerns)

Five specialized controllers manage distinct responsibilities:

- **DataController**: Manages data model with get/set/delete operations. Supports formatted vs raw values, middleware pipeline, reactive updates
- **FlowController**: Executes navigation state machine. Handles state transitions, subflow invocation, flow stack management
- **ViewController**: Manages view rendering and updates. Resolves view AST, handles switches/templates, tracks binding dependencies
- **ValidationController**: Multi-phase validation system. Coordinates schema validations and cross-field rules, manages validation triggers
- **SchemaController**: Central registry for data types, formatters, and validators. Provides type information for bindings

All controllers accessible during InProgressState via `state.controllers`.

**Controller Lifecycle:**

**Creation:**

- Controllers instantiated when `start(flow)` called
- Created as part of InProgressState transition
- Accessible via `state.controllers` immediately after state becomes in-progress

**Lifetime:**

- Exist for duration of single flow execution
- All share same data model instance
- State is mutable during flow execution
- Cannot be accessed before flow starts or after flow completes

**Destruction:**

- Controllers released when flow completes (CompletedState)
- Controllers released on error (ErrorState)
- NOT reused between flows—new instances created for each `start()` call

**Safe Access Pattern:**

```typescript
const state = player.getState();
if (state.status === "in-progress") {
  // Safe to access controllers
  const data = state.controllers.data;
  const flow = state.controllers.flow;
  data.set([["user.name", "John"]]);
} else {
  // Controllers not available - accessing will throw error
}
```

**Critical:** Never store controller references across flows. Always get fresh reference via `getState()`.

### Plugin System (Tapable Hooks)

Plugins extend Player by tapping into 12+ hook points. Use Tapable pattern for synchronous hooks. Plugins register during Player construction, apply via `apply(player)` method.

**Common plugin patterns**:

- Register custom expression functions
- Add data model middleware
- Register validators and formatters
- Transform view AST
- React to state transitions

Plugins compose—later plugins can modify earlier plugin behaviors.

**Plugin Composition:**

**Plugin Order Matters:**

- Plugins applied in array order during construction
- Later plugins can wrap/override earlier plugins' behavior
- Hook tap order determines execution order

**Plugin Interaction Patterns:**

- **Chaining:** Each plugin adds to behavior (e.g., expression functions accumulate)
- **Wrapping:** Later plugin wraps earlier (e.g., data middleware composes)
- **Overriding:** Later plugin replaces earlier (e.g., validators with same type)

**Conflict Resolution:**

- Expression functions: Last registration wins (same name)
- Validators: Last registration wins (same type)
- Data middleware: All execute in order (compose)
- Formatters: Last registration wins (same type)

**Recommended Plugin Order:**

```typescript
// Good: Clear dependency hierarchy
[
  TypesPlugin, // Foundation (types/formatters)
  ExpressionPlugin, // Depends on types
  ValidationPlugin, // Depends on types + expressions
  CustomPlugin, // Depends on all above
][
  // Bad: Order-dependent without clear reason
  (PluginA, PluginB, PluginC)
]; // Unclear dependencies
```

**Anti-patterns:**

- Plugins with circular dependencies
- Plugins modifying Player state outside hooks
- Plugins assuming specific other plugins present (without checking)
- Registering same validator/expression name multiple times unintentionally

### State Machine (Flow Execution)

Player maintains explicit state through `getState()`:

- **NotStartedState**: Initial state, no flow loaded
- **InProgressState**: Flow executing, controllers available, can fail manually
- **CompletedState**: Flow finished successfully, readonly data access
- **ErrorState**: Flow failed with error

State transitions fire hooks—use `hooks.state` to observe. Each flow gets unique ref symbol for tracking.

### Data Model (Reactive with Middleware)

Centralized data storage with binding-based access. Supports:

- **Middleware pipeline**: Intercept get/set/delete operations
- **Formatted vs raw values**: Display transformation separate from storage
- **Default values**: Auto-populate on first read
- **Validation integration**: Schema controller validates during set operations
- **Update batching**: Multiple sets fire single update event

Changes propagate to view automatically via binding subscription.

### View Resolution (AST Processing)

Views parsed as Abstract Syntax Tree with plugins:

- **AssetPlugin**: Resolves asset nodes
- **SwitchPlugin**: Evaluates static/dynamic switches
- **TemplatePlugin**: Expands array templates
- **StringResolverPlugin**: Resolves `{{bindings}}` and `@[expressions]@` in strings
- **ApplicabilityPlugin**: Conditional asset rendering

View updates triggered by binding changes—only affected nodes re-resolve.

### Binding System (Path-Based Data Access)

Immutable binding instances represent data model paths. Parser handles complex syntax:

- Simple: `"user.name"`
- Array index: `"items[0]"`
- Append: `"items[]"`
- Dynamic: `"items[{{key}}]"` (nested binding)
- Query: `"items[status='active']"` (filter)

Bindings used throughout: data access, validation refs, expression contexts.

### Expression Evaluator (Custom Language)

Executes expression strings with custom operators and functions. NOT JavaScript eval—controlled environment.

**Supports**:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`, `===`, `!==`
- Logical: `&&`, `||`, `!`
- Assignment: `=`, `+=`, `-=`
- Ternary: `condition ? true : false`
- Function calls: `someFunc(arg1, arg2)`
- Data references: `@binding@`

Plugins register custom functions via `expressionEvaluator.operators.expressions`.

## API Surface

### Player Class

**Constructor**:

```typescript
new Player(config?: {
  plugins?: PlayerPlugin[];
  logger?: Logger;
})
```

**Static Properties**:

- `Player.info`: { version: string, commit: string }

**Instance Methods**:

- `start(flow: Flow): Promise<CompletedState>` - Execute flow, returns when complete
- `getState(): PlayerFlowState` - Current execution state
- `getPlugins(): PlayerPlugin[]` - List registered plugins
- `findPlugin<T>(symbol: symbol): T | undefined` - Find plugin by symbol
- `applyTo<T>(symbol, apply: (plugin: T) => void)` - Conditionally apply to plugin
- `registerPlugin(plugin: PlayerPlugin)` - Add plugin dynamically (post-construction)
- `getVersion(): string` - Player version
- `getCommit(): string` - Git commit hash

**Hooks** (via `player.hooks`):

- `flowController`, `viewController`, `view`, `expressionEvaluator`, `dataController`, `schema`, `validationController`, `bindingParser` - Controller creation hooks
- `state` - State transitions
- `onStart`, `onEnd` - Flow lifecycle
- `resolveFlowContent` - Mutate flow before start (waterfall)

### DataController

**Key Methods**:

- `get(binding: BindingLike, options?: DataModelOptions): any` - Read data
- `set(transaction: RawSetTransaction, options?: DataModelOptions): Updates` - Write data (batch)
- `delete(binding: BindingLike, options?: DataModelOptions): void` - Remove data
- `serialize(): object` - Export current data model

**DataModelOptions**:

- `formatted?: boolean` - Get/set formatted values (vs raw)
- `includeInvalid?: boolean` - Include data failing validation
- `ignoreDefaultValue?: boolean` - Don't auto-populate defaults
- `silent?: boolean` - Skip view update notifications

**Transaction formats**:

- Array: `[["binding1", value1], ["binding2", value2]]`
- Object: `{ binding1: value1, binding2: value2 }`

**Hooks**: `resolveDefaultValue`, `format`, `deformat`, `serialize`, `onSet`, `onGet`, `onDelete`, `onUpdate`

### FlowController

**Key Methods**:

- `start(): Promise<NavigationFlowEndState>` - Begin flow state machine
- `transition(stateTransition: string, options?: TransitionOptions): void` - Navigate to state

**Behavior**:

- Manages navigation stack for nested flows
- Automatically handles FLOW state type (subflows)
- Returns END state outcome when complete

### ViewController

**Key Properties**:

- `currentView?: ViewInstance` - Currently rendered view
- `transformRegistry` - Asset transform registry

**Key Methods**:

- `onView(state: NavigationFlowViewState): void` - Render new view
- `updateViewAST(nodes: Set<Node.Node>): void` - Manual view update

View updates happen automatically on data changes via binding subscription.

### ValidationController

**Key Methods**:

- `validateView(trigger: Validation.Trigger): void` - Validate current view
- `forView(parseBinding): ValidationResponse` - Get validation interface for view

**Triggers**: "navigation", "change", "load"

Integrates with SchemaController for type-based validations and View for cross-field validations.

### SchemaController

**Key Methods**:

- `getType(binding: BindingInstance): Schema.DataTypes | undefined` - Get type definition
- `getApparentType(binding): Schema.DataTypes | undefined` - Type with base type merged
- `getFormatter(binding): FormatDefinition | undefined` - Get formatter for binding
- `getFormatterForType(ref: Formatting.Reference)` - Get formatter by ref
- `addFormatters(fns: Array<FormatType>)` - Register formatters
- `addDataTypes(types: Array<Schema.DataType>)` - Register data types

Central hub for data types, validation, and formatting rules.

### BindingInstance

**Key Methods**:

- `asArray(): RawBindingSegment[]` - Array representation
- `asString(): string` - String representation
- `contains(binding): boolean` - Check if binding is sub-path
- `parent(): BindingInstance` - Get parent binding
- `key(): RawBindingSegment` - Get last segment
- `descendent(relative): BindingInstance` - Navigate down path

Immutable—all operations return new instances.

### BindingParser

**Key Method**:

- `parse(rawBinding: BindingLike, options?): BindingInstance` - Parse string/array to BindingInstance

Handles complex query syntax, dynamic keys, conditional access.

### ExpressionEvaluator

**Key Methods**:

- `evaluate(exp: ExpressionType, options?): any` - Sync evaluation
- `evaluateAsync(exp: ExpressionType, options?): Promise<any>` - Async evaluation
- `reset(): void` - Clear temporary variables

**Operators**: Access via `expressionEvaluator.operators.expressions` (Map)

**Hooks**: `resolve`, `resolveOptions`, `beforeEvaluate`, `onError`

## Common Usage Patterns

### Starting a Flow

**When to use**: Basic Player integration.

**Approach**:

1. Create Player instance with plugins
2. Call `start(flowJSON)` - returns promise
3. Monitor state via `hooks.state` tap
4. Access controllers during InProgressState
5. Handle CompletedState or ErrorState

**Example pattern**:

```typescript
const player = new Player({ plugins: [myPlugin] });
player.hooks.state.tap("my-app", (state) => {
  if (state.status === "in-progress") {
    // Access state.controllers
  }
});
const result = await player.start(flowJSON);
```

**Considerations**: Controllers only available during in-progress. Don't access before flow starts.

### Creating Plugins

**When to use**: Extending Player functionality.

**Approach**:

1. Implement PlayerPlugin interface (name, apply, optional symbol)
2. In `apply(player)`, tap into hooks
3. Register validators, formatters, expressions, middleware
4. Return symbol for retrieval via `findPlugin`

**Pattern**:

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

**Considerations**: Plugin order matters—later plugins can override earlier ones. Use symbols for plugin retrieval.

### Working with DataController

**When to use**: Reading/writing data during flow execution.

**Approach**:

1. Access via `state.controllers.data` (in InProgressState)
2. Use `get(binding, options)` for reads
3. Use `set(transaction, options)` for writes
4. Specify `formatted: true` for display values
5. Listen to `hooks.onUpdate` for change notifications

**Formatted vs raw**:

- Raw: What's stored in model (e.g., phone number digits)
- Formatted: What user sees (e.g., "(555) 123-4567")

**Batch sets**:

```typescript
data.set([
  ["user.name", "John"],
  ["user.age", 30],
]);
```

**Considerations**: Setting formatted values requires formatter to deformat. Silent option prevents view updates.

### Custom Expression Functions

**When to use**: Adding domain-specific logic to expressions.

**Approach**:

1. Tap `hooks.expressionEvaluator`
2. Register function via `evaluator.operators.expressions.set(name, fn)`
3. Function receives (context, ...args)
4. Return value or throw error

**Pattern**:

```typescript
player.hooks.expressionEvaluator.tap("custom", (evaluator) => {
  evaluator.operators.expressions.set("toUpperCase", (context, value) =>
    String(value).toUpperCase(),
  );
});
// In flow: "@[toUpperCase(@user.name@)]@"
```

**Considerations**: Async functions need special handling. Use context for data model access.

### Custom Validators

**When to use**: Adding validation rules beyond built-in types.

**Approach**:

1. Tap `hooks.validationController`
2. Register validator type via `validation.registerValidatorType(name, fn)`
3. Function receives (context, value, options)
4. Return undefined (valid) or { message, severity } (invalid)

**Pattern**:

```typescript
player.hooks.validationController.tap("validators", (validation) => {
  validation.registerValidatorType("email", (context, value) => {
    if (!value?.includes("@")) {
      return { message: "Invalid email format" };
    }
  });
});
```

**Considerations**: Validators run based on trigger (load/change/navigation). Use blocking to control navigation.

## Dependencies

- **@player-ui/types**: Type definitions for all Player concepts
- **@player-ui/partial-match-registry**: Asset transform registry (Registry class)
- **@player-ui/make-flow**: Flow construction utilities
- **tapable-ts**: Hook system (SyncHook, SyncWaterfallHook, etc.)
- **timm**: Immutable object operations (setIn, getIn)
- **p-defer**: Promise utilities
- **dequal**: Deep equality checks

## Integration Points

### Hook System

12+ hook points for extension:

- Controller creation hooks: Modify controllers after instantiation
- State transitions: React to flow lifecycle
- Data operations: Intercept get/set/delete
- View updates: Transform AST before rendering
- Expression evaluation: Add custom operators

### Plugin Architecture

Plugins apply during construction via `apply(player)`. Can:

- Register validators, formatters, data types
- Add data model middleware
- Transform views
- Add expression functions
- React to any hook

### Controller Access

During InProgressState, access all controllers via `state.controllers`. Enables:

- Data manipulation
- Flow transitions
- Validation triggering
- Type lookups

### Middleware System

Data model supports middleware for:

- Validation
- Logging
- Caching
- Custom business logic

Middleware intercepts get/set/delete operations.

## Common Pitfalls

1. **Accessing controllers before InProgressState**: State is NotStarted until `start()` called. Check `status === "in-progress"` first.

2. **Forgetting async in expressions**: ASYNC_ACTION requires `await: true` to block. Without it, promises don't await.

3. **Formatted vs raw value confusion**: `data.get(binding)` returns raw by default. Use `{ formatted: true }` for display values. Setting formatted requires deformatter.

4. **Plugin registration timing**: Plugins registered in constructor apply in order. Dynamic registration via `registerPlugin()` applies immediately.

5. **Binding mutations**: BindingInstance is immutable. Operations like `parent()`, `descendent()` return new instances.

6. **Expression context**: Expressions evaluate in isolated context. Use `@binding@` syntax to reference data, not JavaScript variable names.

7. **View updates during silent sets**: `data.set(transaction, { silent: true })` prevents view updates. Use for intermediate calculations only.

8. **Navigation transition errors**: Calling `transition()` before flow starts or after completion throws. Check FlowController.current exists.

9. **Default value side effects**: Reading undefined binding with schema default writes to model. Use `ignoreDefaultValue: true` to prevent.

10. **Validation blocking behavior**: Default is `blocking: true` for errors, `blocking: "once"` for warnings. Navigation blocked until fixed.

11. **Hook tap order matters**: Earlier taps run first. Waterfall hooks pass modified values through chain.

12. **State ref uniqueness**: Each flow execution gets unique ref symbol. Don't compare states across flows by ref.

## Debugging Patterns

**Expression Evaluation Failures:**

```typescript
player.hooks.expressionEvaluator.tap("debug", (evaluator) => {
  evaluator.hooks.onError.tap("debug", (error, expression) => {
    console.error("Expression failed:", expression, error);
  });
});
```

**Binding Resolution Issues:**

```typescript
player.hooks.dataController.tap("debug", (dataController) => {
  dataController.hooks.onGet.tap("debug", (binding, value) => {
    console.log("Binding resolved:", binding.asString(), "→", value);
  });
  dataController.hooks.onSet.tap("debug", (updates) => {
    console.log("Data updated:", updates);
  });
});
```

**Validation Errors:**

```typescript
player.hooks.validationController.tap("debug", (validation) => {
  validation.hooks.onValidate.tap("debug", (results) => {
    console.log("Validation results:", results);
  });
});
```

**State Machine Transitions:**

```typescript
player.hooks.state.tap("debug", (state) => {
  console.log("State changed:", state.status);
  if (state.status === "in-progress") {
    state.controllers.flow.hooks.transition.tap("debug", (to, from) => {
      console.log("Navigation:", from, "→", to);
    });
  }
});
```

**Inspecting Controller State:**
Use browser DevTools or Node.js debugger to pause execution and inspect:

- `state.controllers.data.serialize()` - Current data model
- `state.controllers.view.currentView` - View AST
- `state.controllers.validation.getValidationState()` - Validation errors

## Reference Files

- `/core/player/src/player.ts` - Main Player class
- `/core/player/src/types.ts` - Player state types
- `/core/player/src/controllers/data/controller.ts` - DataController implementation
- `/core/player/src/controllers/flow/controller.ts` - FlowController implementation
- `/core/player/src/controllers/view/controller.ts` - ViewController implementation
- `/core/player/src/controllers/validation/controller.ts` - ValidationController
- `/core/player/src/schema/schema.ts` - SchemaController
- `/core/player/src/binding/binding.ts` - BindingInstance and BindingParser
- `/core/player/src/expressions/evaluator.ts` - ExpressionEvaluator
- `/core/player/src/view/view.ts` - ViewInstance
- `/core/player/src/data/index.ts` - Data model middleware system
- `/core/player/src/string-resolver/index.ts` - String binding/expression resolution

## Performance Considerations

- **Binding parsing**: Cached per BindingParser instance. Reuse parser for efficiency.
- **View updates**: Only affected nodes re-resolve. Binding subscription tracks dependencies automatically.
- **Data middleware**: Pipeline runs on every get/set. Keep middleware fast.
- **Expression evaluation**: Faster than JavaScript eval but slower than native code. Minimize in hot paths.
- **Validation timing**: Use "navigation" trigger for expensive validations to avoid change-triggered overhead.
