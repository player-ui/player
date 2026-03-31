# Package: @player-ui/react

## Overview

React integration layer for Player UI. Provides hooks, components, and asset rendering system to bridge the headless Player engine with React UI. Wraps core Player with React-specific concerns: component registry, Suspense integration, error boundaries, and state subscriptions. Use this package to render Player flows in React applications.

Re-exports everything from `@player-ui/player` plus React-specific APIs — single import for complete React integration. Also aliased as `WebPlayer` for backwards compatibility.

> **Cross-references**: This document covers React-specific APIs only. Core Player engine concepts (controllers, hooks, state machine, plugin system, expressions) are in `@player-ui/player`. Flow JSON types and structure (assets, bindings, navigation, schema, validation) are in `@player-ui/types`. When loaded via MCP with dependencies, those documents are included automatically.

## Core Concepts

### ReactPlayer Class

Wraps the core Player with React rendering capabilities. Does NOT extend Player — instead holds a `player: Player` property. Additions beyond the base Player API:

- **assetRegistry**: Maps asset types to React components (partial-match Registry)
- **Component**: Auto-generated root React component for rendering (includes ErrorBoundary, PlayerContext, AssetContext)
- **viewUpdateSubscription**: Pub/sub for view changes (Suspense-compatible via `Subscribe<View>`)
- **Tapable hooks**: `webComponent`, `playerComponent`, `onBeforeViewReset`
- **Devtools**: Constructor auto-detects `window.__PLAYER_DEVTOOLS_PLUGIN` and injects it as a plugin

One ReactPlayer instance per flow sequence. Create via `new ReactPlayer(options)` or `useReactPlayer()` hook.

**Constructor behavior**: Filters plugins with `apply` method for the core Player instance. Calls `applyReact` on all plugins. Applies internal `OnUpdatePlugin` to bridge core view updates to `viewUpdateSubscription`.

### Asset Registry

Partial-match registry mapping asset types to React components. More specific matches win (ordered by number of matching fields):

- Exact type match: `{ type: "button" }`
- Partial match: `{ type: "action" }` matches "action-button", "action-link"
- Object match: `{ type: "button", variant: "primary" }` — more fields = higher specificity

Register via plugins' `applyReact` method. ReactAsset looks up components during render.

### useReactPlayer Hook

Primary integration hook. Returns `{ reactPlayer, player, playerState }`. The `reactPlayer` instance is stable across renders (useMemo with `[]` deps). `playerState` is reactive — triggers re-renders on flow state transitions via internal `StateTapPlugin`. Use once per flow container.

**Important**: Options (plugins, player) are captured on first render only. Changes to options after mount are silently ignored due to empty dependency array.

### ManagedPlayer Component

Orchestrates multi-flow experiences with automatic flow chaining. Calls `manager.next()` initially and after each flow completion. Returns `{ value: flow }` to continue, `{ done: true }` to end.

Requires a Suspense boundary ancestor — the `ReactPlayer.Component` rendered inside calls `viewUpdateSubscription.suspend()`, which throws promises during view loading.

**Error handling**: On error, `onError` callback fires unconditionally if provided (during state transition). For rendering: (1) if `fallbackComponent` is provided, it renders with `reset`/`retry`/`error` props; (2) else if `onError` is NOT provided, the error is thrown (requires error boundary ancestor); (3) else (`onError` provided but no `fallbackComponent`) the component renders `null`. Both `onError` and `fallbackComponent` can fire for the same error.

**Cleanup**: On unmount or manager change while a flow is running, automatically calls `manager.terminate(serializedData)` with the current data model snapshot.

Internally uses `useRequestTime` for flow request latency tracking via `@player-ui/metrics-plugin`.

### ManagedPlayer State Machine

Internal state machine drives the multi-flow lifecycle (via `ManagedPlayerState` discriminated union):

```
not_started → pending → loaded → running → completed → pending (next flow) or ended
                                                    ↘ error
```

| State         | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `not_started` | Initial state, calls `manager.next()`                        |
| `pending`     | Awaiting `manager.next()` response                           |
| `loaded`      | Flow received, not yet started                               |
| `running`     | Flow executing via `reactPlayer.start()`                     |
| `completed`   | Flow finished, feeds result to `manager.next()` for chaining |
| `ended`       | Manager returned `{ done: true }`, triggers `onComplete`     |
| `error`       | Any step failed — see error handling above                   |

### Subscribe System

Cross-bridge pub/sub that works with React Suspense (`@player-ui/react-subscribe` package). `suspend()` throws a promise for Suspense boundaries, blocking until `publish()` emits the next value. Enables view updates to trigger React renders via subscription.

Key methods: `publish(val)`, `add(callback, options?)`, `remove(id)`, `reset(promise?)`, `suspend()`, `get()`.

`useSubscribedState(subscriber)` bridges Subscribe into React via `useSyncExternalStore` (polyfilled for React 16/17 via `use-sync-external-store/shim`).

### Context Providers

- **PlayerContext** (`PlayerContextType`): Provides Player instance and optional `viewState` to component tree. Access via `usePlayer()`. Set automatically by `ReactPlayer.Component`.
- **AssetContext** (`ContextType`): Provides asset registry to ReactAsset components. Auto-provided by `ReactPlayer.Component`.

```typescript
interface PlayerContextType {
  player?: Player;
  viewState?: NavigationFlowViewState;
}
```

### Plugin Architecture

Dual plugin system via `ReactPlayerPlugin`:

- **apply(player)**: Standard Player plugin hooks (see `@player-ui/player`)
- **applyReact(reactPlayer)**: React-specific setup (asset registry, React hooks)

Plugins can implement either or both. During construction, plugins with `apply` are passed to the core Player. All plugins with `applyReact` are called on the ReactPlayer instance.

## API Surface

### ReactPlayer Class

```typescript
new ReactPlayer(options?: {
  player?: Player;
  plugins?: ReactPlayerPlugin[];
})
```

**React-specific properties** (ReactPlayer holds a `player: Player`, it does not inherit from Player):

- `options: ReactPlayerOptions` — constructor options (readonly)
- `player: Player` — core Player instance
- `assetRegistry: Registry<React.ComponentType>` — asset-to-component map
- `Component: React.ComponentType<ReactPlayerComponentProps>` — root render component
- `viewUpdateSubscription: Subscribe<View>` — view change pub/sub
- `hooks.webComponent: SyncWaterfallHook` — wrap outermost component (providers, global UI)
- `hooks.playerComponent: SyncWaterfallHook` — wrap per-view component (receives `{ view: View }`)
- `hooks.onBeforeViewReset: AsyncParallelHook` — async tasks before view subscription resets

**React-specific methods**:

- `start(flow): Promise<CompletedState>` — start a flow (wraps `player.start()` with view subscription reset before and after). **Always use this instead of `player.start()` directly.**
- `setWaitForNextViewUpdate(): Promise<void>` — reset view subscription, wait for next view update
- `getPlayerVersion(): string` — current Player version
- `getPlayerCommit(): string` — git commit of Player build
- `findPlugin<T>(symbol): T | undefined` — find React plugin by symbol
- `registerPlugin(plugin): void` — register plugin post-construction (see Pitfall #7 for caveats)

### useReactPlayer Hook

```typescript
useReactPlayer(options?: ReactPlayerOptions): {
  reactPlayer: ReactPlayer;
  player: Player;
  playerState: PlayerFlowState;
}
```

Call once at flow container level. Pass plugins via options. State updates on flow transitions. **Options are frozen after first render** — the ReactPlayer is created once via `useMemo(..., [])`.

### ManagedPlayer Component

```typescript
interface ManagedPlayerProps extends ReactPlayerOptions {
  manager: FlowManager;
  onStartedFlow?: () => void;
  onComplete?: (finalState?: CompletedState) => void;
  onError?: (e: Error) => void;
  fallbackComponent?: React.ComponentType<FallbackProps>;
}

interface FlowManager {
  next(previousValue?: CompletedState): Promise<FinalState | NextState<Flow>>;
  terminate?(data?: FlowResult["data"]): void;
}

interface FallbackProps {
  reset?: () => void; // restart from beginning
  retry?: () => void; // retry from last successful result
  error?: Error;
}
```

### Hooks

- `usePlayer(): Player | undefined` — access Player from context
- `useLogger(): Logger` — access logger (returns `NoopLogger` if no player)
- `useAssetProps(asset): { id, "data-asset-type" }` — common DOM props for asset elements
- `useGetConstant(key): unknown` — access constant from default "constants" namespace (requires `@player-ui/shared-constants-plugin`)
- `useGetConstantByType(type, key): unknown` — access constant under a specific namespace (requires `@player-ui/shared-constants-plugin`)
- `useRequestTime(): { withRequestTime, RequestTimeMetricsPlugin }` — track flow request latency (used internally by ManagedPlayer, also available for custom multi-flow orchestration)
- `usePersistentStateMachine(options): { managedState, state }` — lower-level hook for managed flow state that persists across Suspense unmounts (used internally by ManagedPlayer)

### ReactAsset Component

Accepts `Asset | AssetWrapper`. Unwraps wrappers, looks up React component from registry by partial match, renders with asset props. Wraps in ErrorBoundary — on render error, creates `AssetRenderError` with parent asset chain for debugging. On type mismatch, error message includes Levenshtein-distance suggestions.

### AssetRenderError Class

Structured error for asset render failures in nested trees:

```typescript
class AssetRenderError extends Error {
  readonly rootAsset: Asset;
  readonly innerException?: unknown;
  initialMessage: string;
  innerExceptionMessage: string;
  addAssetParent(asset: Asset): void;
  getAssetPathMessage(): string;
}
```

When a nested asset throws, the ErrorBoundary wraps the error in `AssetRenderError` and builds a parent chain via `addAssetParent()` as it propagates up through nested ReactAsset boundaries. The resulting `message` includes the full asset path and inner exception for debugging.

### ReactPlayerPlugin Interface

```typescript
interface ReactPlayerPlugin extends Partial<PlayerPlugin> {
  name: string;
  applyReact?: (reactPlayer: ReactPlayer) => void;
  apply?: (player: Player) => void;
}
```

## Exported Types

Key types exported from `@player-ui/react` (in addition to all re-exports from `@player-ui/player`):

| Type                        | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `ReactPlayer`               | Main class wrapping Player with React rendering               |
| `WebPlayer`                 | Alias of `ReactPlayer` for backwards compatibility            |
| `ReactPlayerPlugin`         | Plugin interface with `applyReact`                            |
| `ReactPlayerOptions`        | `{ player?: Player; plugins?: ReactPlayerPlugin[] }`          |
| `ReactPlayerComponentProps` | `Record<string, unknown>` — props for `ReactPlayer.Component` |
| `ReactPlayerInfo`           | Alias of `PlayerInfo` — `{ version, commit }`                 |
| `UseReactPlayerReturn`      | Return type of `useReactPlayer`                               |
| `ManagedPlayerProps`        | Props for ManagedPlayer component                             |
| `FlowManager`               | Iterator interface for multi-flow orchestration               |
| `FinalState`                | `{ done: true }` — marks iteration complete                   |
| `NextState<T>`              | `{ done?: false; value: T }` — next flow                      |
| `FallbackProps`             | Props for ManagedPlayer error fallback component              |
| `ManagedPlayerContext`      | Internal context for managed state machine                    |
| `ManagedPlayerState`        | Discriminated union of managed player states                  |
| `ManagerMiddleware`         | Middleware for manager responses                              |
| `StateChangeCallback`       | Listener type for managed state changes                       |
| `AssetRegistryType`         | `Registry<React.ComponentType<any>>`                          |
| `ContextType`               | AssetContext shape — `{ registry?: AssetRegistryType }`       |
| `PlayerContextType`         | PlayerContext shape — `{ player?, viewState? }`               |
| `AssetRenderError`          | Structured error class for asset render failures              |
| `DevtoolsGlobals`           | Type for `window.__PLAYER_DEVTOOLS_PLUGIN`                    |
| `DevtoolsWindow`            | `typeof window & DevtoolsGlobals`                             |

## Common Usage Patterns

### Basic Player Setup

```tsx
const App = () => {
  const { reactPlayer, playerState } = useReactPlayer({
    plugins: [new ReferenceAssetsPlugin()],
  });

  React.useEffect(() => {
    reactPlayer.start(myFlow);
  }, []);

  if (playerState.status === "error")
    return <ErrorUI error={playerState.error} />;
  return <reactPlayer.Component />;
};
```

### Multi-Flow with ManagedPlayer

```tsx
const manager: FlowManager = {
  async next(prevResult) {
    if (!prevResult) return { value: await fetchFlow1() };
    if (prevResult.data.continue)
      return { value: await fetchFlow2(prevResult.data) };
    return { done: true };
  },
  terminate(data) {
    saveProgressToServer(data);
  },
};

<Suspense fallback={<Loading />}>
  <ManagedPlayer
    manager={manager}
    plugins={plugins}
    onComplete={(state) => console.log("Done", state)}
    fallbackComponent={ErrorScreen}
  />
</Suspense>;
```

Use `prevResult.data` to pass state between flows. Throw in `next()` to trigger error boundary, or return `{ done: true }` to end gracefully. Implement `terminate` to save data when the component unmounts mid-flow.

### Custom Asset Registration

```typescript
const MyPlugin: ReactPlayerPlugin = {
  name: "my-plugin",
  applyReact(rp) {
    rp.assetRegistry.set({ type: "my-asset" }, MyAssetComponent);
    rp.assetRegistry.set({ type: "action" }, ActionComponent); // partial match
    rp.assetRegistry.set({ type: "button", variant: "primary" }, PrimaryButton);
  },
};
```

Later registrations override earlier ones for the same match key. More specific matches (more fields) take priority over less specific ones.

### Accessing Player in Custom Assets

Use `usePlayer()` hook to access the Player instance, then use controllers as documented in `@player-ui/player`:

```tsx
const MyAsset = (props: MyAssetProps) => {
  const player = usePlayer();
  const handleClick = () => {
    const state = player?.getState();
    if (state?.status === "in-progress") {
      state.controllers.data.set([["user.selection", props.value]]);
      state.controllers.flow.transition("next");
    }
  };
  return <button onClick={handleClick}>{props.label}</button>;
};
```

### Wrapping Root Component

```tsx
reactPlayer.hooks.webComponent.tap("wrapper", (Comp) => {
  return (props) => (
    <ThemeProvider>
      <Comp {...props} />
    </ThemeProvider>
  );
});
```

Waterfall hook — each tap wraps previous. `webComponent` wraps the outermost shell (good for providers). `playerComponent` wraps the per-view renderer (receives `{ view: View }`). Order matters.

## Dependencies

- **@player-ui/player**: Core headless engine (re-exported — see its knowledge doc)
- **@player-ui/types**: Type definitions (re-exported — see its knowledge doc)
- **@player-ui/partial-match-registry**: Asset registry implementation
- **@player-ui/react-subscribe**: Subscribe system for Suspense-compatible view updates
- **@player-ui/metrics-plugin**: Request time tracking for ManagedPlayer
- **react-error-boundary**: Error boundaries in ReactPlayer.Component and ReactAsset
- **use-sync-external-store**: Polyfill for `useSyncExternalStore` (React 16/17 compat)
- **leven**: Levenshtein distance for asset type mismatch suggestions
- **react** (peer): React 16.8+ (hooks required; `useSyncExternalStore` polyfilled)

## Common Pitfalls

1. **Missing Suspense boundary**: `ReactPlayer.Component` calls `viewUpdateSubscription.suspend()`, which throws a promise before the first view is ready. Wrap with `<Suspense>` when using ManagedPlayer, or when the view may not be immediately available.

2. **`useReactPlayer` options are frozen**: Options (plugins, player) passed to `useReactPlayer` are captured on first render via `useMemo(..., [])`. Changing props/state that affect options will NOT update the ReactPlayer instance.

3. **Asset registry registration timing**: Register assets via plugins before first render. Post-render registration won't affect current view.

4. **usePlayer returns undefined**: Requires PlayerContext.Provider ancestor (auto-provided by `ReactPlayer.Component`). Always null-check before accessing.

5. **Asset type mismatches**: Check error messages for Levenshtein suggestions. Case-sensitive matching.

6. **Plugin apply vs applyReact**: Core Player hooks go in `apply()`, React-specific (registry) goes in `applyReact()`. Both are called during construction.

7. **`registerPlugin` only calls `applyReact`**: Post-construction `registerPlugin()` does NOT call `apply()` on the core player. Only `applyReact` runs. If the plugin has no `applyReact`, it returns early and does nothing.

8. **Reactive state not updating**: Use `playerState` from `useReactPlayer()` for re-renders — `player.getState()` does not trigger re-renders.

9. **`reactPlayer.start()` vs `player.start()`**: Always use `reactPlayer.start(flow)` — it wraps `player.start()` with view subscription resets before and after the flow. Calling `player.start()` directly skips view subscription management and may cause stale/missing renders.

10. **Multiple ReactPlayer instances**: Don't create multiple for same flow. Use one instance, restart with new flow.

11. **FlowManager next() rejection**: Unhandled rejections crash ManagedPlayer. Use try-catch or provide `fallbackComponent`.

12. **ManagedPlayer error handling**: `onError` fires unconditionally if provided (during state transition). For rendering: `fallbackComponent` renders if present; else if no `onError` either, the error is thrown; else (`onError` only) the component renders `null` — which may cause a blank screen. Provide `fallbackComponent` for visible error recovery.

13. **ManagedPlayer `terminate` on unmount**: When ManagedPlayer unmounts or manager changes while a flow runs, it calls `manager.terminate(data)` with serialized data. Implement `terminate` to save progress.

14. **`useGetConstant` / `useGetConstantByType` require plugin**: These hooks access `player.constantsController`, which is always available on the Player instance, but constants data is populated by `@player-ui/shared-constants-plugin`. Without that plugin, they return `undefined`.

## Testing

```tsx
// Mock PlayerContext for custom asset tests
const mockPlayer = {
  getState: () => ({
    status: "in-progress",
    controllers: { data: { set: vi.fn() } },
  }),
  hooks: { state: { tap: () => {} } },
};
render(
  <PlayerContext.Provider value={{ player: mockPlayer }}>
    <MyCustomAsset label="Test" />
  </PlayerContext.Provider>,
);

// Test ManagedPlayer flow sequence
const manager = {
  next: vi
    .fn()
    .mockResolvedValueOnce({ value: flow1 })
    .mockResolvedValueOnce({ done: true }),
};
render(
  <Suspense fallback={<div>Loading</div>}>
    <ManagedPlayer manager={manager} onComplete={onComplete} plugins={[]} />
  </Suspense>,
);
await waitFor(() => expect(onComplete).toHaveBeenCalled());

// Test with AssetContext for ReactAsset
const registry = new Registry();
registry.set({ type: "test" }, TestComponent);
render(
  <AssetContext.Provider value={{ registry }}>
    <ReactAsset id="test-1" type="test" />
  </AssetContext.Provider>,
);
```

## Reference Files

- `/react/player/src/player.tsx` — ReactPlayer class (also exports `WebPlayer` alias)
- `/react/player/src/hooks.tsx` — useReactPlayer hook
- `/react/player/src/manager/managed-player.tsx` — ManagedPlayer component and usePersistentStateMachine
- `/react/player/src/manager/types.ts` — FlowManager, ManagedPlayerProps, FallbackProps interfaces
- `/react/player/src/manager/request-time.tsx` — useRequestTime hook
- `/react/player/src/asset/index.tsx` — ReactAsset component, AssetContext, AssetRegistryType
- `/react/player/src/asset/AssetRenderError.ts` — AssetRenderError class
- `/react/player/src/app.tsx` — Internal ReactPlayer component (renders `<ReactAsset {...view} />`)
- `/react/player/src/utils/player-context.ts` — PlayerContext, PlayerContextType, usePlayer
- `/react/player/src/utils/use-logger.ts` — useLogger hook
- `/react/player/src/utils/use-asset-props.tsx` — useAssetProps hook
- `/react/player/src/utils/shared-constants.tsx` — useGetConstant, useGetConstantByType hooks
- `/react/subscribe/src/index.tsx` — Subscribe system and useSubscribedState

## Performance Considerations

- **Asset registry lookups**: O(n) partial-match scan ordered by specificity. Keep registry small or use exact matches for hot paths.
- **View subscriptions**: Only re-render when view actually changes. Efficient by default via `useSyncExternalStore`.
- **Context updates**: PlayerContext rarely updates (flow start/end). AssetContext static per instance.
- **Suspense boundaries**: Granular boundaries reduce blocked components during view transitions.
