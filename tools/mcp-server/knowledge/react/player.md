# Package: @player-ui/react

## Overview

React integration layer for Player UI. Provides hooks, components, and asset rendering system to bridge the headless Player engine with React UI. Wraps core Player with React-specific concerns: component registry, Suspense integration, error boundaries, and state subscriptions. Use this package to render Player flows in React applications.

Re-exports everything from `@player-ui/player` plus React-specific APIs — single import for complete React integration.

> **Cross-references**: This document covers React-specific APIs only. Core Player engine concepts (controllers, hooks, state machine, plugin system, expressions) are in `@player-ui/player`. Flow JSON types and structure (assets, bindings, navigation, schema, validation) are in `@player-ui/types`. When loaded via MCP with dependencies, those documents are included automatically.

## Core Concepts

### ReactPlayer Class

Extends Player with React rendering capabilities. Additions beyond the base Player API:

- **assetRegistry**: Maps asset types to React components (partial-match Registry)
- **Component**: Auto-generated root React component for rendering
- **viewUpdateSubscription**: Pub/sub for view changes (Suspense-compatible)
- **React hooks**: `webComponent`, `playerComponent`, `onBeforeViewReset`

One ReactPlayer instance per flow sequence. Create via `new ReactPlayer(options)` or `useReactPlayer()` hook.

### Asset Registry

Partial-match registry mapping asset types to React components:

- Exact type match: `{ type: "button" }`
- Partial match: `{ type: "action" }` matches "action-button", "action-link"
- Object match: `{ type: "button", variant: "primary" }`

Register via plugins' `applyReact` method. ReactAsset looks up components during render.

### useReactPlayer Hook

Primary integration hook. Returns `{ reactPlayer, player, playerState }`. The `reactPlayer` instance is stable across renders (useMemo). `playerState` is reactive — triggers re-renders on flow state transitions. Use once per flow container.

### ManagedPlayer Component

Orchestrates multi-flow experiences with automatic flow chaining. Calls `manager.next()` initially and after each flow completion. Returns `{ value: flow }` to continue, `{ done: true }` to end.

Requires a Suspense boundary ancestor — throws promises during flow loading. Provides built-in error boundaries with `fallbackComponent` prop for retry/reset.

### Subscribe System

Cross-bridge pub/sub that works with React Suspense. `suspend()` throws a promise for Suspense boundaries, blocking until `publish()` emits the next value. Enables view updates to trigger React renders via subscription.

### Context Providers

- **PlayerContext**: Provides Player instance to component tree. Access via `usePlayer()`.
- **AssetContext**: Provides asset registry to ReactAsset components. Auto-provided by `ReactPlayer.Component`.

### Plugin Architecture

Dual plugin system via `ReactPlayerPlugin`:

- **apply(player)**: Standard Player plugin hooks (see `@player-ui/player`)
- **applyReact(reactPlayer)**: React-specific setup (asset registry, React hooks)

Plugins can implement either or both.

## API Surface

### ReactPlayer Class

```typescript
new ReactPlayer(options?: {
  player?: Player;
  plugins?: ReactPlayerPlugin[];
})
```

**React-specific properties** (beyond inherited Player API — see `@player-ui/player`):

- `assetRegistry: Registry<React.ComponentType>` — asset-to-component map
- `Component: React.ComponentType` — root render component
- `viewUpdateSubscription: Subscribe<View>` — view change pub/sub
- `hooks.webComponent: SyncWaterfallHook` — wrap root component
- `hooks.playerComponent: SyncWaterfallHook` — wrap player component
- `hooks.onBeforeViewReset: AsyncParallelHook` — pre-reset async tasks

**React-specific methods**:

- `setWaitForNextViewUpdate(): Promise<void>` — wait for next view update

### useReactPlayer Hook

```typescript
useReactPlayer(options?: ReactPlayerOptions): {
  reactPlayer: ReactPlayer;
  player: Player;
  playerState: PlayerFlowState;
}
```

Call once at flow container level. Pass plugins via options. State updates on flow transitions.

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
  terminate?(data?: any): void;
}
```

### Hooks

- `usePlayer(): Player | undefined` — access Player from context
- `useLogger(): Logger` — access logger (noop if no player)
- `useAssetProps(asset): { id, "data-asset-type" }` — common DOM props
- `useGetConstant(key): any` / `useGetConstantByType(type, key): any` — access ConstantsController

### ReactAsset Component

Accepts `Asset | AssetWrapper`. Unwraps wrappers, looks up React component from registry, renders with asset props. Wraps in ErrorBoundary with Levenshtein-distance suggestions for type mismatches.

### ReactPlayerPlugin Interface

```typescript
interface ReactPlayerPlugin extends Partial<PlayerPlugin> {
  name: string;
  applyReact?: (reactPlayer: ReactPlayer) => void;
  apply?: (player: Player) => void;
}
```

## Common Usage Patterns

### Basic Player Setup

```typescript
const App = () => {
  const { reactPlayer, playerState } = useReactPlayer({
    plugins: [new ReferenceAssetsPlugin()]
  });

  React.useEffect(() => { reactPlayer.start(myFlow); }, []);

  if (playerState.status === "error") return <ErrorUI error={playerState.error} />;
  return <reactPlayer.Component />;
};
```

### Multi-Flow with ManagedPlayer

```typescript
const manager: FlowManager = {
  async next(prevResult) {
    if (!prevResult) return { value: await fetchFlow1() };
    if (prevResult.data.continue) return { value: await fetchFlow2(prevResult.data) };
    return { done: true };
  },
};

<Suspense fallback={<Loading />}>
  <ManagedPlayer manager={manager} plugins={plugins}
    onComplete={(state) => console.log('Done', state)}
    fallbackComponent={ErrorScreen} />
</Suspense>
```

Use `prevResult.data` to pass state between flows. Throw in `next()` to trigger error boundary, or return `{ done: true }` to end gracefully.

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

Later registrations override earlier ones. Partial match is prefix-based.

### Accessing Player in Custom Assets

Use `usePlayer()` hook to access the Player instance, then use controllers as documented in `@player-ui/player`:

```typescript
const MyAsset = (props: MyAssetProps) => {
  const player = usePlayer();
  const handleClick = () => {
    const state = player?.getState();
    if (state?.status === 'in-progress') {
      state.controllers.data.set([['user.selection', props.value]]);
      state.controllers.flow.transition('next');
    }
  };
  return <button onClick={handleClick}>{props.label}</button>;
};
```

### Wrapping Root Component

```typescript
reactPlayer.hooks.webComponent.tap('wrapper', (Comp) => {
  return (props) => (
    <ThemeProvider><ErrorBoundary><Comp {...props} /></ErrorBoundary></ThemeProvider>
  );
});
```

Waterfall hook — each tap wraps previous. Order matters.

## Dependencies

- **@player-ui/player**: Core headless engine (re-exported — see its knowledge doc)
- **@player-ui/types**: Type definitions (re-exported — see its knowledge doc)
- **@player-ui/partial-match-registry**: Asset registry implementation
- **@player-ui/react-subscribe**: Subscribe system for Suspense
- **react** (peer): React 16.8+ (hooks required)

## Common Pitfalls

1. **Missing Suspense boundary for ManagedPlayer**: Requires Suspense ancestor or throws unhandled promise. Without Suspense, ReactPlayer alone still works but has no loading state.

2. **Asset registry registration timing**: Register assets via plugins before first render. Post-render registration won't affect current view.

3. **usePlayer returns undefined**: Requires PlayerContext.Provider ancestor. Always null-check before accessing.

4. **Asset type mismatches**: Check error messages for Levenshtein suggestions. Case-sensitive matching.

5. **Plugin apply vs applyReact**: Core Player hooks go in `apply()`, React-specific (registry) goes in `applyReact()`.

6. **Reactive state not updating**: Use `playerState` from `useReactPlayer()` for re-renders — `player.getState()` does not trigger re-renders.

7. **Multiple ReactPlayer instances**: Don't create multiple for same flow. Use one instance, restart with new flow.

8. **FlowManager next() rejection**: Unhandled rejections crash ManagedPlayer. Use try-catch or provide `fallbackComponent`.

## Testing

```typescript
// Mock PlayerContext for custom asset tests
const mockPlayer = {
  getState: () => ({ status: 'in-progress', controllers: { data: { set: vi.fn() } } }),
  hooks: { state: { tap: () => {} } }
};
render(
  <PlayerContext.Provider value={mockPlayer}>
    <MyCustomAsset label="Test" />
  </PlayerContext.Provider>
);

// Test ManagedPlayer flow sequence
const manager = {
  next: vi.fn()
    .mockResolvedValueOnce({ value: flow1 })
    .mockResolvedValueOnce({ done: true }),
};
render(
  <Suspense fallback={<div>Loading</div>}>
    <ManagedPlayer manager={manager} onComplete={onComplete} plugins={[]} />
  </Suspense>
);
await waitFor(() => expect(onComplete).toHaveBeenCalled());
```

## Reference Files

- `/react/player/src/player.tsx` — ReactPlayer class
- `/react/player/src/hooks.tsx` — useReactPlayer hook
- `/react/player/src/manager/managed-player.tsx` — ManagedPlayer component
- `/react/player/src/manager/types.ts` — FlowManager interface
- `/react/player/src/asset/index.tsx` — ReactAsset component and registry
- `/react/player/src/asset/AssetRenderError.ts` — AssetRenderError class
- `/react/player/src/app.tsx` — ReactPlayer component (simple view renderer)
- `/react/player/src/utils/player-context.ts` — PlayerContext and usePlayer
- `/react/subscribe/src/index.tsx` — Subscribe system

## Performance Considerations

- **Asset registry lookups**: O(n) partial-match. Keep registry small or use exact matches for hot paths.
- **View subscriptions**: Only re-render when view actually changes. Efficient by default.
- **Context updates**: PlayerContext rarely updates (flow start/end). AssetContext static per instance.
- **Suspense boundaries**: Granular boundaries reduce blocked components.
