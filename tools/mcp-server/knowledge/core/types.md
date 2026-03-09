# Package: @player-ui/types

## Overview

Pure TypeScript type definitions that form the foundation of Player UI. Contains NO runtime code—only interface and type declarations. Use this package when you need type safety for Player flows, assets, navigation state machines, data bindings, expressions, schemas, and validation rules. Every other Player UI package depends on these types.

## Core Concepts

### Flow

A complete user experience definition represented as JSON. Contains four key sections:

- **views**: Array of UI screens (assets) that can be rendered
- **navigation**: State machine defining flow control and transitions
- **schema**: Data structure definitions with validation and formatting rules
- **data**: Initial data model values

Think of a Flow as a self-contained application specification that Player executes.

### Asset

The smallest unit of user interaction. JSON representation of a UI component with:

- **id**: Unique identifier within a view (required)
- **type**: Determines which React/native component renders it (required)
- Additional properties based on asset type (flexible schema)

Assets are platform-agnostic—the same asset JSON works across React, iOS, and Android.

### Navigation State Machine

Defines how users move through the flow using state types:

- **VIEW**: Render a view to the user
- **ACTION**: Execute synchronous expression, return value determines transition
- **ASYNC_ACTION**: Execute async expression with optional await
- **END**: Terminal state with outcome (how flow completed)
- **EXTERNAL**: Pause for external app to trigger transition
- **FLOW**: Invoke a sub-flow

Navigation is deterministic—each state's transitions are explicit.

### Binding

String-based reference to a location in the data model. Format: `"path.to.data"` or with template syntax `"{{path.to.data}}"`.

Supports advanced syntax:

- Array access: `"items[0]"`, `"items[]"` (append)
- Dynamic keys: `"items[keyName]"`
- Conditional: `"items[type='active']"`

Bindings create reactive connections—when data changes, views update automatically.

### Expression

Custom evaluation language for logic and computation. Can be:

- Single string: `"someFunction(arg1, arg2)"`
- String array: `["statement1", "statement2", "return value"]`

Expressions reference data model with `@path.to.data@` syntax. Evaluated by Player's expression engine, NOT JavaScript eval. Supports operators, function calls, ternaries, and custom registered functions.

### Schema

Type system for the data model. Defines:

- **ROOT**: Top-level object structure
- **Data types**: Base types with validation and formatting
- **Validation rules**: Multi-phase error checking
- **Formatters**: Transform values for display vs storage

Schema enables type-safe data manipulation and automatic validation.

### Switch Mechanism

Conditional rendering for assets. Two types:

- **staticSwitch**: Evaluated once on first render
- **dynamicSwitch**: Re-evaluated when referenced data changes

Each switch contains cases with `asset` and `case` (expression or `true`). First matching case wins.

**When to use StaticSwitch:**

- Value determined at render time and won't change
- Based on static data or initial state
- Performance-critical sections (avoids re-evaluation)
- Example: Show different intro based on user type (set once)

**When to use DynamicSwitch:**

- Value depends on user input or changing data
- Need reactive updates based on data model changes
- Accept slight performance cost for reactivity
- Example: Show different content based on form selection

**When to avoid switches:**

- More than 5-7 cases - consider separate views or expression-based navigation
- Complex logic spanning multiple conditions - use expressions in navigation instead
- Deep nesting - flattens better as separate views

### Template

Maps an array in the data model to an array of objects/assets. Enables dynamic list rendering:

- **data**: Binding to source array
- **value**: Template for each item (uses `{{_index_}}` for iteration index)
- **output**: Property to store results
- **dynamic**: Re-compute on data changes (default: false)

**Dynamic vs Static Templates:**

- `dynamic: false` (default): Evaluated once on first render, results cached
- `dynamic: true`: Re-evaluated whenever source array changes
- Use dynamic for reactive lists that add/remove/reorder items
- Use static for performance when list won't change

**_index_ Usage Patterns:**

```typescript
// Current iteration index
"{{_index_}}"  // 0, 1, 2, ...

// Use in bindings
"items[{{_index_}}].value"

// Use in conditionals
{
  "case": "{{_index_}} > 0",  // Skip first item
  "asset": { ... }
}

// Combine with other bindings
"item-{{_index_}}-{{items[{{_index_}}].id}}"
```

**Common Template Patterns:**

- List rendering: Map array to collection of assets
- Dynamic forms: Generate input fields from schema
- Paginated data: Template over page items
- Conditional rendering per item: Combine with switches inside template

## API Surface

### Primary Type Exports

**Flow Structure**:

- `Flow<T>`: Complete flow payload (id, views, schema, data, navigation)
- `View<T>`: Asset with optional cross-field validations
- `FlowResult`: Flow completion data (endState, serialized data)

**Assets**:

- `Asset<T>`: Base asset (id, type, extensible properties)
- `AssetWrapper<T>`: Container with asset property
- `AssetBinding`: Asset with binding property
- `Switch<T>`: Array of SwitchCase for conditional rendering
- `StaticSwitch<T>`: Evaluate once on first render
- `DynamicSwitch<T>`: Re-evaluate on data changes

**Navigation**:

- `Navigation`: State machine definition (BEGIN + flows)
- `NavigationFlow`: Individual flow (startState, onStart/onEnd, states)
- `NavigationFlowViewState`: Render view state
- `NavigationFlowActionState`: Synchronous action state
- `NavigationFlowAsyncActionState`: Async action state (with await flag)
- `NavigationFlowEndState`: Terminal state (with outcome)
- `NavigationFlowExternalState`: External control state
- `NavigationFlowFlowState`: Sub-flow invocation state

**Data Model**:

- `DataModel`: Record<any, unknown> - where all user data lives
- `Binding`: String path to data location
- `BindingRef`: Template literal type `{{${Binding}}}`

**Expressions**:

- `Expression`: string | string[] - code execution representation
- `ExpressionRef`: Template literal `@[${string}]@`
- `ExpressionObject`: Object with optional `exp` property

**Schema System**:

- `Schema.Schema`: Root schema definition
- `Schema.Node`: Object with property type definitions
- `Schema.DataType<T>`: Property type (type, validation, format, default)
- `Schema.RecordType`: Record/map type
- `Schema.ArrayType`: Array type

**Validation**:

- `Validation.Reference`: Validation rule (type, message, severity, trigger, blocking)
- `Validation.CrossfieldReference`: Cross-field validation with ref binding
- `Validation.Severity`: "error" | "warning"
- `Validation.Trigger`: "navigation" | "change" | "load"
- `Validation.DisplayTarget`: "page" | "section" | "field"

**Formatting**:

- `Formatting.Reference`: Formatter reference (type + options)

**Templates**:

- `Template<ValueType, Key>`: Array mapping definition
- `Templatable`: Interface with template array property

## Common Usage Patterns

### Creating Custom Asset Types

**When to use**: Defining domain-specific UI components with type safety.

**Approach**:

1. Extend `Asset<"your-type">` interface with semantic properties
2. Avoid generic "data" objects—make properties meaningful
3. Use TypeScript to enforce required properties
4. Consider switch mechanisms for conditional rendering

**Example pattern**:

```typescript
interface ButtonAsset extends Asset<"button"> {
  label: string;
  action?: Expression;
  disabled?: boolean;
}
```

**Considerations**: Asset id must be unique per view. Type determines rendering component.

### Defining Navigation State Machines

**When to use**: Controlling flow progression and user journeys.

**Approach**:

1. Start with BEGIN flow pointing to first NavigationFlow
2. Define states with explicit state_type and transitions
3. Use VIEW states to show UI, ACTION states for logic
4. END states include outcome for flow composition

**Key pattern**:

```typescript
navigation: {
  BEGIN: "FLOW_1",
  FLOW_1: {
    startState: "VIEW_1",
    VIEW_1: {
      state_type: "VIEW",
      ref: "view-id",
      transitions: { next: "END" }
    },
    END: {
      state_type: "END",
      outcome: "done"
    }
  }
}
```

**Considerations**:

- Lifecycle hooks (onStart/onEnd) run at flow and state levels
- ASYNC_ACTION with `await: true` blocks until promise resolves
- EXTERNAL states pause until app calls transition

### Working with Bindings

**When to use**: Creating reactive data connections throughout the flow.

**Syntax**:

- Simple: `"user.name"`
- Array index: `"items[0]"`
- Append to array: `"items[]"`
- Dynamic key: `"items[{{selectedKey}}]"`
- Conditional: `"items[status='active']"`

**In flow JSON**: Use template syntax `{{binding}}` for string interpolation.

**Considerations**:

- Bindings are paths, not JavaScript expressions
- Nested bindings allowed: `{{user.{{fieldName}}}}`
- Changes trigger view updates automatically

### Schema Definition and Validation

**When to use**: Enforcing data structure, validation, and formatting.

**Approach**:

1. Define ROOT object with property types
2. Add validation rules per property (with triggers)
3. Specify formatters for display vs storage transformation
4. Set default values for automatic initialization

**Validation triggers**:

- **load**: Check once when binding first appears
- **change**: Check on every data change
- **navigation**: Check when user attempts to navigate

**Blocking behavior**:

- `blocking: true`: Always block navigation on error
- `blocking: false`: Never block (warnings only)
- `blocking: "once"`: Block first time, then allow

**Considerations**:

- Formatted vs deformatted values (what user sees vs what's stored)
- Cross-field validations live on View, not Schema
- Display targets control where errors appear

## Dependencies

None. This is the foundation package—all other Player UI packages depend on types.

## Integration Points

- **@player-ui/player**: Uses these types for runtime type safety throughout controllers, plugins, and APIs
- **@player-ui/react**: Extends types for React-specific components and props
- **Plugins**: Define custom asset types, validation rules, and expression functions
- **Flow authoring**: JSON flows must conform to these type definitions

## Common Pitfalls

1. **Binding syntax confusion**: Remember `"path.to.data"` is the binding, `{{path.to.data}}` is template syntax for string interpolation
2. **Navigation state_type typos**: Must be exact: "VIEW", "END", "ACTION", "ASYNC_ACTION", "EXTERNAL", "FLOW"
3. **Asset id uniqueness**: IDs must be unique per view, not globally
4. **Switch case order matters**: First matching case wins—order cases carefully
5. **Template _index_ reference**: Use `{{_index_}}` not `{{index}}` in template values
6. **Validation trigger timing**: "load" only fires once, "change" fires repeatedly
7. **Cross-field validation location**: Must be on View, not in Schema
8. **Expression array behavior**: Last expression is return value, earlier ones are statements
9. **Async action await flag**: Must explicitly set `await: true` to block on promises
10. **Schema default values**: Reading undefined binding writes default to model automatically

## Reference Files

- `/core/types/src/index.ts` - Complete type definitions (all types in one file)
- `/core/types/package.json` - Package metadata

## Version Compatibility

Types are designed for forward compatibility. New properties are additive. Breaking changes are major version bumps. Always use `@player-ui/types` version matching your `@player-ui/player` version for best compatibility.
