---
name: Create React Player Plugin
description: Use when the user wants to create a React plugin for Player UI that registers custom asset components, adds React context providers, or extends ReactPlayer. Covers the ReactPlayerPlugin interface, asset registration, ReactPlayer hooks, context wrapping, ReactAsset for child rendering, custom hooks, and testing with @testing-library/react.
version: "2.0"
argument-hint: "[plugin-name e.g. my-ui-components]"
---

# Create React Player Plugin

You are helping a developer create a React plugin for Player UI in their own project. React plugins register UI components (assets), add React context providers, wrap the component tree via ReactPlayer hooks, and extend ReactPlayer.

**Choose the right plugin type:**

- **Core plugin** — runs on all platforms, no React dependency, taps Player hooks only. See `create-core-plugin`.
- **React plugin** — React-specific; registers components, uses React context, wraps the React tree.
- **Both** — extend a core plugin class and implement `ReactPlayerPlugin` when you need runtime hooks _and_ UI behavior (this is the most common pattern for plugins that have a core counterpart).

**Before writing any code**, confirm the plugin name and asset types with the user.

---

## Install Dependencies

```bash
npm install @player-ui/react @player-ui/asset-provider-plugin-react
```

For testing:

```bash
npm install -D vitest @player-ui/make-flow @testing-library/react
```

---

## `<PluginName>Plugin.tsx` — Plugin Class

### Standalone React Plugin (no core counterpart)

Use this when the plugin is React-only (e.g. registering asset components):

```tsx
import type { ReactPlayer, ReactPlayerPlugin, Player } from "@player-ui/react";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";
import { <AssetName> } from "./assets/<AssetName>";

export class <PluginName>Plugin implements ReactPlayerPlugin {
  name = "<plugin-name>-web-plugin";

  applyReact(reactPlayer: ReactPlayer): void {
    reactPlayer.registerPlugin(
      new AssetProviderPlugin([
        ["<asset-type>", <AssetName>],
      ]),
    );
  }

  // Optional — only if you also need core Player hooks
  apply(player: Player): void {
    // Tap player hooks here
  }
}
```

`ReactPlayerPlugin` already extends `Partial<PlayerPlugin>`, so implementing `PlayerPlugin` separately is unnecessary. If `apply` is present it will be called by the core Player; if `applyReact` is present it will be called by ReactPlayer.

### Wrapping a Core Plugin

When a core plugin already exists, the standard pattern is to extend it and add `applyReact`:

```tsx
import type { ReactPlayer, ReactPlayerPlugin } from "@player-ui/react";
import { <CorePluginName> as <CorePluginName>Core } from "@player-ui/<core-plugin-package>";

export class <PluginName>Plugin
  extends <CorePluginName>Core
  implements ReactPlayerPlugin
{
  name = "<plugin-name>-web-plugin";

  applyReact(reactPlayer: ReactPlayer): void {
    // React-specific setup (context providers, asset registration, etc.)
  }
}
```

This gives consumers a single plugin that handles both core hooks (inherited from the base class `apply`) and React setup. The `apply` method from the core class runs automatically.

---

## `assets/<AssetName>.tsx` — Asset Component

Use the `Asset` generic type from `@player-ui/player` to define asset props:

```tsx
import React from "react";
import type { Asset } from "@player-ui/react";

export interface <AssetName>Asset extends Asset<"<asset-type>"> {
  value?: string;
  // Add asset-specific fields from the flow JSON
}

export const <AssetName> = (props: <AssetName>Asset) => {
  return (
    <div id={props.id}>
      {props.value}
    </div>
  );
};
```

`Asset<"type">` provides `id: string` and `type: "type"` automatically. Player resolves all data bindings and expressions before passing the object as props.

If a companion core plugin defines transform types (e.g. `TransformedInput` from `@player-ui/reference-assets-plugin`), use those as your component props instead of defining a new interface.

---

## Rendering Child Assets — `ReactAsset`

Asset components that contain nested assets must use `ReactAsset` to render them. In flow JSON, child assets are wrapped as `{ asset: { id, type, ... } }` (the `AssetWrapper` type).

```tsx
import React from "react";
import type { Asset, AssetWrapper } from "@player-ui/react";
import { ReactAsset } from "@player-ui/react";

interface CollectionAsset extends Asset<"collection"> {
  values: Array<AssetWrapper>;
  label?: AssetWrapper;
}

export const Collection = (props: CollectionAsset) => {
  return (
    <div id={props.id}>
      {props.label && <ReactAsset {...props.label.asset} />}
      {props.values.map((wrapper) => (
        <ReactAsset key={wrapper.asset.id} {...wrapper.asset} />
      ))}
    </div>
  );
};
```

`ReactAsset` looks up the correct component implementation from the asset registry and renders it. Always unwrap the `asset` property from the `AssetWrapper` before spreading into `ReactAsset`.

---

## `index.tsx`

Re-export everything from the plugin and assets. If wrapping a core plugin, re-export the core package so consumers only need one import:

```typescript
// Re-export core plugin types so consumers don't need a separate import
export * from "@player-ui/<core-plugin-package>";

export * from "./<PluginName>Plugin";
export * from "./assets/<AssetName>";
```

If the plugin has no core counterpart, omit the core re-export.

---

## Asset Registration Patterns

The `AssetProviderPlugin` maps asset type strings to React components. This is the canonical registration method:

```tsx
new AssetProviderPlugin([
  ["button", ButtonAsset],
  ["action", ActionAsset],
  ["collection", CollectionAsset],
]);
```

String matches use the partial-match registry, so `"action"` matches `"action"`, `"action-button"`, etc.

For tests or simple inline setups, you can register directly on the asset registry (not recommended for production plugins):

```tsx
applyReact(rp: ReactPlayer): void {
  rp.assetRegistry.set({ type: "my-asset" }, MyAssetComponent);
}
```

---

## ReactPlayer Hooks Reference

`ReactPlayer` exposes hooks that plugins tap in `applyReact` to wrap the React component tree:

| Hook                | Type                                 | Purpose                                          |
| ------------------- | ------------------------------------ | ------------------------------------------------ |
| `webComponent`      | `SyncWaterfallHook<[ComponentType]>` | Wrap the outer component (context providers)     |
| `playerComponent`   | `SyncWaterfallHook<[ComponentType]>` | Wrap the per-view component (view-level effects) |
| `onBeforeViewReset` | `AsyncParallelHook`                  | Run async tasks before a view is torn down       |

### `hooks.webComponent.tap` — Adding Context Providers

This is the primary pattern for React plugins that provide React context to the tree. Used by beacon, check-path, auto-scroll, and asset-provider plugins:

```tsx
applyReact(reactPlayer: ReactPlayer): void {
  reactPlayer.hooks.webComponent.tap(this.name, (Comp) => {
    const contextValue = { /* ... */ };

    function WrappedComponent() {
      return (
        <MyContext.Provider value={contextValue}>
          <Comp />
        </MyContext.Provider>
      );
    }

    return WrappedComponent;
  });
}
```

The waterfall hook receives the current component and returns a new one that wraps it. Multiple plugins can chain wrapping — each receives the result of the previous tap.

### `hooks.playerComponent.tap` — View-Level Wrapping

Use this to wrap the component that renders each view. Useful for per-view side effects:

```tsx
applyReact(reactPlayer: ReactPlayer): void {
  reactPlayer.hooks.playerComponent.tap(this.name, (Comp) => {
    function ViewWrapper(props: { view: any }) {
      React.useEffect(() => {
        // Side effect when view renders
      }, [props.view]);

      return <Comp {...props} />;
    }

    return ViewWrapper;
  });
}
```

---

## Creating Plugin-Specific Hooks

Plugins that provide React context should export custom hooks so asset components and consumers can access the context:

```tsx
import React from "react";

// Define the context
export interface MyPluginContextType {
  handler: (args: SomeArgs) => void;
}

export const MyPluginContext = React.createContext<MyPluginContextType>({
  handler: () => undefined,
});

// Export a hook for consumers
export function useMyPlugin(): MyPluginContextType {
  return React.useContext(MyPluginContext);
}

// In the plugin class, provide the context via webComponent tap
export class MyPlugin implements ReactPlayerPlugin {
  name = "my-plugin-web-plugin";

  applyReact(reactPlayer: ReactPlayer): void {
    const handler = this.doSomething.bind(this);

    reactPlayer.hooks.webComponent.tap(this.name, (Comp) => {
      function MyPluginProvider() {
        return (
          <MyPluginContext.Provider value={{ handler }}>
            <Comp />
          </MyPluginContext.Provider>
        );
      }

      return MyPluginProvider;
    });
  }

  private doSomething(args: SomeArgs): void {
    // Plugin logic
  }
}
```

Asset components then use `useMyPlugin()` to access the context without prop drilling.

---

## Using Player in Asset Components

Asset components can access the Player instance via hooks. This is primarily useful for action-type assets that need to trigger transitions or write data:

```tsx
import { usePlayer } from "@player-ui/react";
import type { Asset } from "@player-ui/react";

interface ActionAsset extends Asset<"action"> {
  label: string;
  value: string;
  exp?: string;
}

const Action = (props: ActionAsset) => {
  const player = usePlayer();

  const handleClick = () => {
    const state = player?.getState();
    if (state?.status === "in-progress") {
      if (props.exp) {
        state.controllers.expression.evaluate(props.exp);
      }

      state.controllers.flow.transition(props.value);
    }
  };

  return (
    <button type="button" onClick={handleClick}>
      {props.label}
    </button>
  );
};
```

Always check `state?.status === "in-progress"` before accessing controllers.

For common DOM attributes, use `useAssetProps`:

```tsx
import { useAssetProps } from "@player-ui/react";

const MyAsset = (props: MyAssetType) => {
  const assetProps = useAssetProps(props);
  // assetProps = { id: "...", "data-asset-type": "..." }

  return <div {...assetProps}>{props.value}</div>;
};
```

---

## Test File — `<PluginName>Plugin.test.tsx`

```tsx
import { describe, test, expect, vitest } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ReactPlayer } from "@player-ui/react";
import { makeFlow } from "@player-ui/make-flow";
import { <PluginName>Plugin } from "..";

describe("<PluginName>Plugin", () => {
  test("renders <asset-type> asset", async () => {
    const rp = new ReactPlayer({
      plugins: [new <PluginName>Plugin()],
    });

    rp.start(
      makeFlow({ id: "my-asset", type: "<asset-type>", value: "Hello" }),
    );

    const { container } = render(
      <React.Suspense fallback="loading...">
        <rp.Component />
      </React.Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeDefined();
    });

    expect(rp.player.getState().status).toBe("in-progress");
  });
});
```

**Testing tips:**

- Always wrap `<rp.Component />` in `<React.Suspense>` — the ReactPlayer component tree uses Suspense internally.
- Call `rp.start(flow)` before `render()` to start the flow.
- Use `makeFlow` from `@player-ui/make-flow` to create a minimal flow from a single asset object.
- For testing hooks or context from your plugin, register inline asset components in the test that call the hooks and assert behavior (see the beacon plugin tests for an example of this pattern).

---

## Using the Plugin

### Basic Setup

```tsx
import React, { Suspense } from "react";
import { useReactPlayer } from "@player-ui/react";
import { <PluginName>Plugin } from "./plugins/<plugin-name>";

const App = () => {
  const { reactPlayer, playerState } = useReactPlayer({
    plugins: [new <PluginName>Plugin()],
  });

  React.useEffect(() => {
    reactPlayer.start(myFlowJSON);
  }, []);

  if (playerState.status === "error") {
    return <div>Error: {playerState.error.message}</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <reactPlayer.Component />
    </Suspense>
  );
};
```

### With ManagedPlayer (Multi-Flow)

```tsx
import { Suspense } from "react";
import { ManagedPlayer } from "@player-ui/react";
import { <PluginName>Plugin } from "./plugins/<plugin-name>";

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ManagedPlayer
      plugins={[new <PluginName>Plugin()]}
      manager={{
        async next(prevResult) {
          if (!prevResult) return { value: firstFlow };
          return { done: true };
        },
      }}
      onComplete={(completedState) => console.log("Done", completedState)}
      onError={(error) => console.error("Flow error", error)}
    />
  </Suspense>
);
```

`ManagedPlayer` requires a `<Suspense>` boundary as an ancestor. The `manager.next()` method receives the previous flow's `CompletedState` (or `undefined` for the first flow) and returns `{ value: Flow }` for the next flow or `{ done: true }` to end.

---

## Available React Hooks

All hooks are imported from `@player-ui/react`.

| Hook                              | Returns                                | Purpose                                              |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `useReactPlayer(options?)`        | `{ reactPlayer, player, playerState }` | Primary integration hook for embedding               |
| `usePlayer()`                     | `Player \| undefined`                  | Access the Player instance from context              |
| `useLogger()`                     | `Logger`                               | Access the Player logger (NoopLogger if unavailable) |
| `useAssetProps(asset)`            | `{ id, "data-asset-type" }`            | Common DOM props for asset wrappers                  |
| `useGetConstant(key)`             | `unknown`                              | Read a shared constant by key                        |
| `useGetConstantByType(type, key)` | `unknown`                              | Read a shared constant by asset type + key           |
