# Package: @player-ui/types

## Overview

Pure TypeScript type definitions forming the foundation of Player UI. Contains NO runtime code — only interface and type declarations. Every other Player UI package depends on these types. Use this package for type safety when authoring or manipulating Player flows, assets, navigation state machines, data bindings, expressions, schemas, and validation rules.

## Core Concepts

### Flow (Complete JSON Structure)

A Flow is a self-contained application specification that Player executes. This is the top-level JSON shape — every Player experience starts here:

```jsonc
{
  "id": "my-flow",
  "views": [
    {
      "id": "view-1",
      "type": "view-type",
      // ... asset properties (platform-agnostic UI)
    }
  ],
  "schema": {
    "ROOT": {
      "myData": { "type": "MyDataType" }
    },
    "MyDataType": {
      "name": { "type": "StringType", "validation": [{ "type": "required" }] },
      "email": {
        "type": "StringType",
        "validation": [
          { "type": "required", "trigger": "navigation", "blocking": true },
          { "type": "email", "trigger": "change", "severity": "error" }
        ],
        "format": { "type": "email" }
      },
      "age": { "type": "IntegerType", "default": 0 }
    }
  },
  "data": {
    "myData": { "name": "initial value" }
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_step1",
      "VIEW_step1": {
        "state_type": "VIEW",
        "ref": "view-1",
        "transitions": { "next": "ACTION_check", "prev": "END_dismiss" }
      },
      "ACTION_check": {
        "state_type": "ACTION",
        "exp": "@myData.age@ >= 18 ? 'adult' : 'minor'",
        "transitions": { "adult": "VIEW_step2", "minor": "END_underage" }
      },
      "VIEW_step2": {
        "state_type": "VIEW",
        "ref": "view-2",
        "transitions": { "next": "END_done" }
      },
      "END_done": { "state_type": "END", "outcome": "done" },
      "END_dismiss": { "state_type": "END", "outcome": "dismiss" },
      "END_underage": { "state_type": "END", "outcome": "underage" }
    }
  }
}
```

All four sections — `views`, `schema`, `data`, `navigation` — are optional except `navigation` and `id`.

### Asset

The smallest unit of user interaction. JSON representation of a UI component:

- **id** (required): Unique identifier within a view
- **type** (required): Determines which React/native component renders it
- Additional properties are flexible per asset type

Assets are platform-agnostic — the same asset JSON renders across React, iOS, and Android.

### Navigation State Machine

Defines how users move through the flow. Each state has an explicit `state_type`:

| State Type       | Purpose                                       | Key Properties                       |
|------------------|-----------------------------------------------|--------------------------------------|
| `VIEW`           | Render a view to the user                     | `ref` (view id), `transitions`       |
| `ACTION`         | Evaluate expression synchronously             | `exp`, `transitions` (return → key)  |
| `ASYNC_ACTION`   | Evaluate expression, optionally await result  | `exp`, `await: boolean`, `transitions` |
| `END`            | Terminal state                                | `outcome` (how flow ended)           |
| `EXTERNAL`       | Pause for host app to trigger transition      | `ref`, `transitions`                 |
| `FLOW`           | Invoke a sub-flow                             | `ref` (flow id), `transitions`       |

Navigation is deterministic — each state's transitions are an explicit `{ transitionName: nextStateName }` map. Lifecycle hooks (`onStart`/`onEnd`) run at both flow and state levels.

### Binding

String-based reference to a location in the data model.

| Syntax                          | Meaning                              |
|---------------------------------|--------------------------------------|
| `"user.name"`                   | Simple path                          |
| `"items[0]"`                    | Array index access                   |
| `"items[]"`                     | Append to array                      |
| `"items[{{selectedKey}}]"`      | Dynamic key (nested binding)         |
| `"items[status='active']"`      | Conditional/query access             |
| `"{{user.name}}"`               | Template syntax for string interpolation |

Bindings create reactive connections — when underlying data changes, views update automatically. In flow JSON, use template syntax `{{binding}}` for string interpolation within values. The bare form `user.name` is the binding itself; `{{user.name}}` embeds it in a string context.

### Expression

Custom evaluation language for logic and computation. Evaluated by Player's expression engine — NOT JavaScript `eval`. Controlled, sandboxed environment.

- Single string: `"someFunction(arg1, arg2)"`
- String array: `["statement1", "statement2", "returnValue"]` — last element is return value
- Data reference: `@path.to.data@` syntax inside expressions
- Expression ref in strings: `@[expression]@` for inline evaluation in string values

Supports: arithmetic (`+`, `-`, `*`, `/`), comparison (`==`, `!=`, `<`, `>`, `===`), logical (`&&`, `||`, `!`), ternary (`a ? b : c`), assignment (`=`, `+=`), and custom registered functions.

### Schema

Type system for the data model. Structured as:

- **ROOT**: Top-level object — properties reference type definitions
- **Named types**: Define structure, validation, formatting, and defaults
- **Validation rules**: Multi-phase error checking per property
- **Formatters**: Transform between display and storage representations

```jsonc
{
  "schema": {
    "ROOT": {
      "person": { "type": "PersonType" }
    },
    "PersonType": {
      "name": {
        "type": "StringType",
        "validation": [
          { "type": "required", "message": "Name is required", "severity": "error", "trigger": "navigation", "blocking": true }
        ]
      },
      "phone": {
        "type": "PhoneType",
        "format": { "type": "phone" },
        "default": ""
      }
    }
  }
}
```

### Validation Details

Validation rules (`Validation.Reference`) control:

| Property        | Values / Type                        | Behavior                                                |
|-----------------|--------------------------------------|---------------------------------------------------------|
| `type`          | string                               | Validator name (looked up in registry)                  |
| `message`       | string (optional)                    | Override default error message                          |
| `severity`      | `"error"` \| `"warning"`            | Errors block; warnings informational                    |
| `trigger`       | `"load"` \| `"change"` \| `"navigation"` | When validation first activates                    |
| `blocking`      | `true` \| `false` \| `"once"`       | Whether to block navigation (`true` default for errors) |
| `displayTarget` | `"field"` \| `"section"` \| `"page"` | Where error renders in UI                              |
| `dataTarget`    | `"formatted"` \| `"deformatted"`    | Which value representation to validate against          |

**Cross-field validations** (`Validation.CrossfieldReference`) live on the `View`, not in Schema. They add a `ref` binding to associate the validation with a specific field.

### Switch Mechanism

Conditional rendering for assets. Two types with distinct evaluation behavior:

- **staticSwitch**: Evaluated once on first render — use for values determined at render time, performance-critical sections
- **dynamicSwitch**: Re-evaluated when referenced data changes — use for reactive updates based on user input

```jsonc
{
  "staticSwitch": [
    { "case": "@user.type@ == 'admin'", "asset": { "id": "admin-view", "type": "admin-panel" } },
    { "case": true, "asset": { "id": "default-view", "type": "basic-panel" } }
  ]
}
```

First matching case wins — order cases from most specific to least. Use `true` as fallback. Avoid more than 5-7 cases; consider separate views or expression-based navigation instead.

An `AssetWrapperOrSwitch` can contain exactly ONE of: `asset`, `staticSwitch`, or `dynamicSwitch` — they are mutually exclusive.

### Template

Maps an array in the data model to an array of objects/assets. Enables dynamic list rendering:

```jsonc
{
  "template": [
    {
      "data": "items",
      "output": "values",
      "value": {
        "asset": {
          "id": "item-{{_index_}}",
          "type": "list-item",
          "binding": "items[{{_index_}}].value"
        }
      },
      "dynamic": false
    }
  ]
}
```

| Property    | Purpose                                                    |
|-------------|-------------------------------------------------------------|
| `data`      | Binding to source array                                     |
| `value`     | Template for each item — `{{_index_}}` is current iteration index |
| `output`    | Property name to store results on parent                    |
| `dynamic`   | `false` (default): evaluated once. `true`: re-evaluated on data changes |
| `placement` | `"append"` (default) or `"prepend"` relative to existing elements |

Use `dynamic: true` only when the source array changes at runtime (add/remove/reorder). Static templates are cached for performance.

## API Surface

### Flow & View

- `Flow<T>`: Top-level payload — `{ id, views?, schema?, data?, navigation }`
- `View<T>`: Asset extended with optional `validation?: CrossfieldReference[]`
- `FlowResult`: Completion data — `{ endState: NavigationFlowEndState, data? }`

### Assets

- `Asset<T>`: Base — `{ id: string, type: T, [key]: unknown }`
- `AssetWrapper<T>`: Container — `{ asset: T }`
- `AssetWrapperOrSwitch<T>`: Union — exactly one of `asset`, `staticSwitch`, or `dynamicSwitch`
- `AssetBinding`: Asset with `binding: Binding` property
- `Switch<T>`: Array of `SwitchCase<T>` — `{ asset: T, case: Expression | true }[]`
- `StaticSwitch<T>`: `{ staticSwitch: Switch<T> }`
- `DynamicSwitch<T>`: `{ dynamicSwitch: Switch<T> }`

### Navigation

- `Navigation`: `{ BEGIN: string } & Record<string, string | NavigationFlow>`
- `NavigationFlow`: `{ startState, onStart?, onEnd?, [stateName]: NavigationFlowState }`
- `NavigationFlowViewState`: `{ state_type: "VIEW", ref, transitions, attributes? }`
- `NavigationFlowActionState`: `{ state_type: "ACTION", exp, transitions }`
- `NavigationFlowAsyncActionState`: `{ state_type: "ASYNC_ACTION", exp, await: boolean, transitions }`
- `NavigationFlowEndState`: `{ state_type: "END", outcome: string }`
- `NavigationFlowExternalState`: `{ state_type: "EXTERNAL", ref, transitions }`
- `NavigationFlowFlowState`: `{ state_type: "FLOW", ref, transitions }`
- `NavigationFlowState`: Union of all six state types
- `NavigationFlowTransition`: `Record<string, string>` — transition name to state name

All transitionable states share: `onStart?`, `onEnd?` lifecycle hooks (Expression | ExpressionObject).

### Data Model & Bindings

- `DataModel`: `Record<any, unknown>`
- `Binding`: `string` — path to data location
- `BindingRef`: `` `{{${Binding}}}` `` — template literal type

### Expressions

- `Expression`: `string | string[]`
- `ExpressionRef`: `` `@[${string}]@` `` — inline expression in strings
- `ExpressionObject`: `{ exp?: Expression }` — used in lifecycle hooks

### Schema System

- `Schema.Schema`: `{ ROOT: Node, [typeName]: Node }`
- `Schema.Node`: `{ [propertyName]: DataTypes }`
- `Schema.DataType<T>`: `{ type, validation?, format?, default?, [key]: unknown }`
- `Schema.RecordType`: DataType with `isRecord: boolean` (mutually exclusive with ArrayType)
- `Schema.ArrayType`: DataType with `isArray: boolean` (mutually exclusive with RecordType)
- `Schema.DataTypes`: `DataType | RecordType | ArrayType`

### Validation & Formatting

- `Validation.Reference`: `{ type, message?, severity?, trigger?, blocking?, displayTarget?, dataTarget? }`
- `Validation.CrossfieldReference`: Reference with `ref?: Binding` (dataTarget always deformatted)
- `Validation.Severity`: `"error" | "warning"`
- `Validation.Trigger`: `"navigation" | "change" | "load"`
- `Validation.DisplayTarget`: `"page" | "section" | "field"`
- `Formatting.Reference`: `{ type: string, [key]: unknown }`

### Templates

- `Template<ValueType, Key>`: `{ data: Binding, value: ValueType, output: Key, dynamic?: boolean, placement?: "prepend" | "append" }`
- `Templatable`: `{ template?: Template[] }`

## Common Usage Patterns

### Creating Custom Asset Types

Extend `Asset<"your-type">` with semantic, domain-specific properties:

```typescript
interface AddressInput extends Asset<"address-input"> {
  label: AssetWrapper;
  binding: Binding;
  required?: boolean;
  validation?: Validation.Reference[];
}
```

Asset `id` MUST be unique per view. `type` determines the rendering component.

### Authoring Navigation State Machines

1. Set `BEGIN` to the name of the first `NavigationFlow`
2. In each flow, set `startState` to the first state name
3. Define states with explicit `state_type` and `transitions`
4. ACTION state `exp` return value is matched against transition keys
5. END states need `outcome` — used by parent flows and FlowResult

### Working with Bindings in Flow JSON

- In asset properties: use template syntax `"Hello, {{user.name}}!"`
- In expression context: use `@` syntax `"@user.name@"`
- Nested bindings are valid: `"{{user.{{currentField}}}}"`
- Array append: `"items[]"` adds to end of array

### Schema with Validation and Formatting

1. Define ROOT with property type references
2. Create named type objects with property definitions
3. Add `validation` arrays with trigger and severity per property
4. Use `format` for display transformation (what user sees vs what's stored)
5. Set `default` values for auto-initialization on first read

## Dependencies

None. This is the foundation package — all other Player UI packages depend on `@player-ui/types`.

## Integration Points

- **@player-ui/player**: Runtime engine consuming these types for controllers, plugins, and all APIs
- **@player-ui/react**: Extends types for React-specific components, props, and hooks
- **Plugins**: Define custom asset types, validation rules, expression functions using these interfaces
- **Flow authoring**: All JSON flows must conform to these type definitions

## Common Pitfalls

1. **Binding vs template syntax**: `"user.name"` is the binding. `"{{user.name}}"` is template syntax for string interpolation. In `exp` properties, use `@user.name@` for data references.

2. **Navigation `state_type` must be exact**: Only valid values are `"VIEW"`, `"END"`, `"ACTION"`, `"ASYNC_ACTION"`, `"EXTERNAL"`, `"FLOW"`. Case-sensitive, no variants.

3. **Asset `id` uniqueness scope**: IDs must be unique within a single view, NOT globally across the flow.

4. **Switch case evaluation order**: First matching case wins. Always put specific cases before the `true` fallback.

5. **Template uses `_index_`**: The iteration variable is `{{_index_}}`, NOT `{{index}}` or `{{i}}`.

6. **Validation trigger semantics**: `"load"` fires once on first appearance. `"change"` fires on every data mutation. `"navigation"` fires when user tries to leave the view.

7. **Cross-field validations go on View**: Place `Validation.CrossfieldReference` in the view's `validation` array, never in Schema.

8. **Expression array return value**: In `["stmt1", "stmt2", "result"]`, only the last element is the return value. Earlier elements are side-effect statements.

9. **ASYNC_ACTION requires explicit `await: true`**: Without it, the promise is NOT awaited and the state transitions immediately.

10. **Schema defaults have side effects**: Reading a binding with a schema-defined `default` automatically WRITES that default to the data model.

11. **`AssetWrapperOrSwitch` exclusivity**: An object can have `asset` OR `staticSwitch` OR `dynamicSwitch` — never more than one. TypeScript enforces this with `never` types.

12. **Expression `@` vs binding `{{}}`**: In `exp` fields, use `@binding@`. In string values within assets, use `{{binding}}`. In string values needing expression evaluation, use `@[expression]@`. Mixing these up is the most common authoring error.

## Reference Files

- `core/types/src/index.ts` — Complete type definitions (single file, all types)
- `core/types/package.json` — Package metadata

## Version Compatibility

Types are designed for forward compatibility. New properties are additive. Breaking changes require major version bumps. Always match `@player-ui/types` version with your `@player-ui/player` version.
