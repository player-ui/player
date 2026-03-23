---
name: Create Core Player Plugin
description: Use when the user wants to create a Player UI plugin in TypeScript that extends the core Player runtime. Covers the PlayerPlugin interface, hook system, expression registration, schema/validation, data middleware, plugin composition, and testing setup in the user's own project.
version: "2.0"
argument-hint: "[plugin-name e.g. analytics-tracker]"
---

# Create Core Player Plugin

You are helping a developer create a TypeScript plugin for the Player UI framework in their own project. Core plugins run on all platforms and tap into the Player hook system to extend functionality.

**Before writing any code**, confirm the plugin name with the user if not provided. Use kebab-case (e.g. `analytics-tracker`). The class name should be PascalCase (e.g. `AnalyticsTrackerPlugin`).

---

## Install Dependencies

```bash
npm install @player-ui/player
```

Optional peer dependencies depending on plugin needs:

```bash
npm install tapable-ts              # Only if exposing custom hooks for plugin-to-plugin communication
npm install @player-ui/make-flow    # For tests
```

---

## `<PluginName>.ts` — Plugin Class

```typescript
import type { Player, PlayerPlugin } from "@player-ui/player";

export const <PluginName>Symbol = Symbol("<PluginName>");

export interface <PluginName>Options {
  // Add constructor options here
}

export class <PluginName> implements PlayerPlugin {
  name = "<PluginName>";

  static Symbol = <PluginName>Symbol;
  public readonly symbol = <PluginName>.Symbol;

  constructor(private options?: <PluginName>Options) {}

  apply(player: Player): void {
    // Access the logger for diagnostics
    player.logger.info("Plugin applied");

    // React to lifecycle state changes — controllers are only available when status === "in-progress"
    player.hooks.state.tap(this.name, (state) => {
      if (state.status === "in-progress") {
        const { controllers } = state;
        // controllers.data, controllers.flow, controllers.view, controllers.expression
      }
    });

    // Register custom expression functions (see ExpressionContext section below)
    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      evaluator.addExpressionFunction("<functionName>", (ctx, ...args) => {
        // ctx.evaluate(expr) — evaluate a sub-expression
        // ctx.model            — read/write bindings on the data model
        // ctx.logger           — log messages
        return args[0];
      });
    });

    // React to view changes
    player.hooks.viewController.tap(this.name, (vc) => {
      vc.hooks.view.tap(this.name, (view) => {
        view.hooks.onUpdate.tap(this.name, (updatedView) => {
          // Handle view updates — updatedView is the resolved view object
        });
      });
    });

    // Clean up state when the flow ends
    player.hooks.onEnd.tap(this.name, () => {
      // Reset any plugin state here
    });
  }
}
```

Always use `this.name` as the tap identifier.

---

## Player Hooks Reference

These are all top-level hooks available on `player.hooks`. Each fires once per flow at setup time, except `state` (fires on every state transition), `view` (fires on every new view), `onStart` / `onEnd` (fire at flow boundaries), and `resolveFlowContent` (fires before flow setup).

| Hook                   | Type                               | Purpose                                                                   |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `state`                | `SyncHook<[PlayerFlowState]>`      | Lifecycle transitions; access controllers when `status === "in-progress"` |
| `flowController`       | `SyncHook<[FlowController]>`       | Navigation and flow transitions                                           |
| `viewController`       | `SyncHook<[ViewController]>`       | View lifecycle and updates                                                |
| `view`                 | `SyncHook<[ViewInstance]>`         | Each new view (shortcut for `viewController.hooks.view`)                  |
| `expressionEvaluator`  | `SyncHook<[ExpressionEvaluator]>`  | Register custom expression functions                                      |
| `dataController`       | `SyncHook<[DataController]>`       | Intercept data get/set operations                                         |
| `schema`               | `SyncHook<[SchemaController]>`     | Register data types and formatters                                        |
| `validationController` | `SyncHook<[ValidationController]>` | Add custom validators                                                     |
| `bindingParser`        | `SyncHook<[BindingParser]>`        | Custom binding syntax                                                     |
| `onStart`              | `SyncHook<[Flow]>`                 | Runs before a flow begins                                                 |
| `onEnd`                | `SyncHook<[]>`                     | Runs after a flow ends (use for cleanup)                                  |
| `resolveFlowContent`   | `SyncWaterfallHook<[Flow]>`        | Transform/mutate flow JSON before execution                               |

All types are imported from `@player-ui/player`.

### Sub-Controller Hooks

Controllers exposed by top-level hooks have their own nested hooks. Common patterns:

```typescript
// Flow lifecycle expressions
player.hooks.flowController.tap(this.name, (fc) => {
  fc.hooks.flow.tap(this.name, (flow) => {
    flow.hooks.onStart.tap(this.name, (startExp) => {
      /* ... */
    });
    flow.hooks.onEnd.tap(this.name, (endExp) => {
      /* ... */
    });
  });
});

// Data model change tracking
player.hooks.dataController.tap(this.name, (dc) => {
  dc.hooks.onUpdate.tap(this.name, (updates) => {
    // updates: Array<{ binding, oldValue, newValue }>
  });
});

// View parser and resolver customization
player.hooks.viewController.tap(this.name, (vc) => {
  vc.hooks.view.tap(this.name, (view) => {
    view.hooks.parser.tap(this.name, (parser) => {
      parser.hooks.onCreateASTNode.tap(this.name, (node, obj) => {
        // Modify AST nodes during parsing
        return node;
      });
    });
    view.hooks.resolver.tap(this.name, (resolver) => {
      resolver.hooks.beforeResolve.tap(this.name, (node, options) => {
        // Transform AST before resolution
        return node;
      });
    });
  });
});
```

---

## Common Patterns

### Expression Registration with ExpressionContext

The first argument to every expression handler is an `ExpressionContext`:

```typescript
interface ExpressionContext {
  evaluate: (expr: ExpressionType) => unknown; // Evaluate a sub-expression
  model: DataModelWithParser; // Read/write data bindings
  logger?: Logger; // Log messages
}
```

Use the context to interact with the data model or evaluate nested expressions:

```typescript
player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
  evaluator.addExpressionFunction("getAndFormat", (ctx, binding, fallback) => {
    const value = ctx.model.get(binding as BindingLike);
    return value ?? ctx.evaluate(fallback as ExpressionType);
  });
});
```

### Schema, Data Types, and Validators

Register custom data types, formatters, and validators through the `schema` and `validationController` hooks:

```typescript
import type {
  Player,
  PlayerPlugin,
  Schema,
  FormatType,
  ValidatorFunction,
} from "@player-ui/player";

apply(player: Player): void {
  // Register custom data types and formatters
  player.hooks.schema.tap(this.name, (schema) => {
    schema.addDataTypes([
      { type: "CustomType", validation: [{ type: "required" }] },
    ] satisfies Array<Schema.DataType>);

    schema.addFormatters([
      {
        name: "myFormatter",
        format: (val: string) => val.toUpperCase(),
        deformat: (val: string) => val.toLowerCase(),
      },
    ] satisfies Array<FormatType<string>>);
  });

  // Register custom validators
  player.hooks.validationController.tap(this.name, (validationController) => {
    validationController.hooks.createValidatorRegistry.tap(
      this.name,
      (registry) => {
        registry.register("customCheck", (context, value) => {
          // context provides: model, parseBinding, evaluate, logger, validation, constants, schemaType
          if (!isValid(value)) {
            return { message: "Value failed custom check" };
          }
        });
      },
    );
  });
}
```

Alternatively, use `@player-ui/types-provider-plugin` to bundle types, formatters, and validators:

```typescript
import { TypesProviderPlugin } from "@player-ui/types-provider-plugin";

const typesPlugin = new TypesProviderPlugin({
  types: [{ type: "PhoneNumber" }],
  formats: [{ name: "phone", format: formatPhone, deformat: deformatPhone }],
  validators: [["phone", phoneValidator]],
});
```

### Data Controller Middleware

Intercept data model operations by adding middleware to the data pipeline via `dataController.hooks.resolveDataStages`:

```typescript
import type { DataModelMiddleware } from "@player-ui/player";

apply(player: Player): void {
  const myMiddleware: DataModelMiddleware = {
    name: this.name,
    get(binding, options, next) {
      // Intercept reads — call next?.get() to continue the pipeline
      return next?.get(binding, options);
    },
    set(transaction, options, next) {
      // Intercept writes — transaction is an array of [binding, value] pairs
      return next?.set(transaction, options) ?? [];
    },
    delete(binding, options, next) {
      return next?.delete(binding, options);
    },
  };

  player.hooks.dataController.tap(this.name, (dc) => {
    dc.hooks.resolveDataStages.tap(this.name, (pipeline) => {
      return [...pipeline, myMiddleware];
    });
  });
}
```

### Transform Flow Content

Use the `resolveFlowContent` waterfall hook to modify flow JSON before Player processes it:

```typescript
player.hooks.resolveFlowContent.tap(this.name, (flow) => {
  // Mutate or replace the flow object — return value is passed to the next tap
  return {
    ...flow,
    data: { ...flow.data, injectedKey: "value" },
  };
});
```

### Using `intercept` (vs `tap`)

Hooks support both `tap` (register a handler) and `intercept` (observe calls without being a formal handler). Use `intercept` for side effects that should not alter the hook's value:

```typescript
player.hooks.flowController.tap(this.name, (fc) => {
  fc.hooks.flow.tap(this.name, (flow) => {
    flow.hooks.resolveTransitionNode.intercept({
      call: (nextState) => {
        // Side effect: runs before the transition proceeds
        player.logger.info("Transitioning to", nextState);
      },
    });
  });
});
```

### Logging

Plugins have access to `player.logger` inside `apply`. Store a reference if needed elsewhere:

```typescript
apply(player: Player): void {
  player.logger.info("Plugin initialized");
  player.logger.warn("Something unexpected");
  player.logger.debug("Verbose detail");
  player.logger.error("Something failed");
}
```

---

## Plugin Composition

### MetaPlugin

Use `MetaPlugin` from `@player-ui/meta-plugin` to bundle multiple plugins into one:

```typescript
import { MetaPlugin } from "@player-ui/meta-plugin";

export class <PluginName> implements PlayerPlugin {
  name = "<PluginName>";

  private readonly metaPlugin = new MetaPlugin([
    new SubPluginA(),
    new SubPluginB(),
  ]);

  apply(player: Player): void {
    player.registerPlugin(this.metaPlugin);
  }
}
```

`player.registerPlugin(plugin)` calls `plugin.apply(player)` and adds the plugin to the internal registry so it is discoverable via `findPlugin`.

### Plugin-to-Plugin Communication

Plugins can expose their own hooks for other plugins to tap:

```typescript
import { SyncHook } from "tapable-ts";

export class <PluginName> implements PlayerPlugin {
  name = "<PluginName>";
  static Symbol = <PluginName>Symbol;
  public readonly symbol = <PluginName>.Symbol;

  public hooks = {
    onCustomEvent: new SyncHook<[EventData]>(),
  };

  apply(player: Player): void { /* ... */ }
}

// Another plugin discovers and taps it:
const myPlugin = player.findPlugin<<PluginName>>(<PluginName>.Symbol);
myPlugin?.hooks.onCustomEvent.tap("OtherPlugin", (data) => {
  // React to the event
});
```

This requires `tapable-ts` as a dependency:

```bash
npm install tapable-ts
```

---

## Test File — `<PluginName>.test.ts`

```typescript
import { expect, test, vi } from "vitest";
import { Player } from "@player-ui/player";
import type { InProgressState } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";
import { <PluginName> } from "..";

test("plugin applies without errors", async () => {
  const plugin = new <PluginName>();
  const player = new Player({ plugins: [plugin] });

  // player.start() returns a Promise<CompletedState> that resolves when the flow completes.
  // Call without await to test the in-progress state immediately.
  player.start(makeFlow({ id: "view-1", type: "info" }));

  const state = player.getState();
  expect(state.status).toBe("in-progress");
});

test("plugin is retrievable by symbol", () => {
  const plugin = new <PluginName>();
  const player = new Player({ plugins: [plugin] });

  const found = player.findPlugin(<PluginName>.Symbol);
  expect(found).toBe(plugin);
});

test("expression function works", () => {
  const plugin = new <PluginName>();
  const player = new Player({ plugins: [plugin] });

  player.start(
    makeFlow({
      id: "view-1",
      type: "info",
      value: "@[<functionName>('hello')]@",
    }),
  );

  const state = player.getState() as InProgressState;
  const resolvedView = state.controllers.view.currentView?.lastUpdate;
  expect(resolvedView?.value).toBe("hello");
});

test("hooks are called during flow", () => {
  const plugin = new <PluginName>();
  const player = new Player({ plugins: [plugin] });
  const hookSpy = vi.fn();

  // Tap before starting to capture controller references
  player.hooks.viewController.tap("test", (vc) => {
    vc.hooks.view.tap("test", (view) => {
      view.hooks.onUpdate.tap("test", hookSpy);
    });
  });

  player.start(makeFlow({ id: "view-1", type: "info" }));

  expect(hookSpy).toHaveBeenCalled();
});
```

**Testing tips:**

- `player.start()` is async but flow setup is synchronous — you can check `player.getState()` immediately after calling it without `await`.
- Cast the state to `InProgressState` to access `controllers`: `const state = player.getState() as InProgressState`.
- Access the resolved view via `state.controllers.view.currentView?.lastUpdate`.
- Access the data model via `state.controllers.data.get(binding)` and `state.controllers.data.set([[binding, value]])`.
- Tap hooks **before** calling `player.start()` to capture controller references.
- Use `vi.fn()` to assert that hooks were called.
- Use `@player-ui/make-flow` to create minimal test flows from a single asset.
- For transform-focused plugins, use `runTransform` from `@player-ui/asset-testing-library`:

```typescript
import { runTransform } from "@player-ui/asset-testing-library";

const { current, controllers } = runTransform("my-asset", myTransform, {
  id: "test",
  type: "my-asset",
  value: "hello",
});

expect(current?.transformedProp).toBe("expected");
```

---

## Using the Plugin

```typescript
import { Player } from "@player-ui/player";
import { <PluginName> } from "./plugins/<plugin-name>";

const player = new Player({
  plugins: [new <PluginName>({ /* options */ })],
});

// player.start() returns Promise<CompletedState> — resolves when the flow reaches an END state
const result = await player.start(myFlowJSON);
// result.data contains the serialized data model
// result.endState contains the terminal navigation state
```
