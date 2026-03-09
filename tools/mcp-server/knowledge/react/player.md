# Package: @player-ui/react

## Overview

React integration layer for Player UI. Provides hooks, components, and asset rendering system to bridge headless Player engine with React UI. Wraps core Player with React-specific concerns: component registry, Suspense integration, error boundaries, and state subscriptions. Use this package to render Player flows in React applications.

Re-exports everything from `@player-ui/player` plus React-specific APIs—single import for complete React integration.

## Core Concepts

### ReactPlayer Class

Extends Player with React rendering capabilities. Main additions:

- **assetRegistry**: Maps asset types to React components (partial-match Registry)
- **Component**: Auto-generated root component for rendering
- **viewUpdateSubscription**: Pub/sub for view changes (Suspense-compatible)
- **React-specific hooks**: webComponent, playerComponent, onBeforeViewReset

One ReactPlayer instance per flow sequence. Create via `new ReactPlayer(options)` or `useReactPlayer()` hook.

### Asset Registry

Partial-match registry mapping asset types to React components. Supports:

- Exact type match: `{ type: "button" }`
- Partial match: `{ type: "action" }` matches "action-button", "action-link"
- Object match: `{ type: "button", variant: "primary" }`

Register via plugins or direct registry access. ReactAsset looks up components during render.

### useReactPlayer Hook

Primary integration hook. Returns:

- **reactPlayer**: ReactPlayer instance (stable across renders)
- **player**: Underlying headless Player
- **playerState**: Reactive state (NotStarted/InProgress/Completed/Error)

Handles plugin registration, state subscriptions, and component creation. Use once per flow container.

### ManagedPlayer Component

Orchestrates multi-flow experiences with automatic flow chaining. Features:

- **FlowManager interface**: Define flow sequencing logic
- **Suspense integration**: Automatic loading states between flows
- **Error boundaries**: Built-in error handling with retry/reset
- **Lifecycle callbacks**: onStartedFlow, onComplete, onError
- **Request metrics**: Automatic timing via request-time plugin

Use for wizard-like experiences or flow sequences.

**Flow Sequencing Visualization:**

```
Initial render → manager.next(undefined)
      ↓
Returns {value: flow1}
      ↓
ReactPlayer starts flow1 → Suspense → Renders flow1 UI
      ↓
User completes flow1 → CompletedState(data: {step1Result: "foo"})
      ↓
manager.next(CompletedState) called
      ↓
Returns {value: flow2}
      ↓
ReactPlayer starts flow2 → Suspense → Renders flow2 UI
      ↓
User completes flow2 → CompletedState(data: {step2Result: "bar"})
      ↓
manager.next(CompletedState) called
      ↓
Returns {done: true}
      ↓
onComplete() fired, flows end
```

**Error Handling in FlowManager:**

```typescript
const manager: FlowManager = {
  async next(prevResult) {
    try {
      const nextFlow = await fetchFlow(prevResult?.data);
      return { value: nextFlow };
    } catch (error) {
      // Option 1: Throw to trigger error boundary
      throw error;

      // Option 2: Return done to end gracefully
      return { done: true };

      // Option 3: Return error flow
      return { value: createErrorFlow(error) };
    }
  },
};
```

**Passing Data Between Flows:**

```typescript
const manager: FlowManager = {
  async next(prevResult) {
    if (!prevResult) {
      return { value: flow1 }; // First flow
    }

    // Extract data from previous flow
    const userSelection = prevResult.data.selectedOption;

    // Use it to configure next flow
    const flow2 = await fetchFlow({ userSelection });

    // Inject previous data into next flow's data model
    flow2.data = {
      ...flow2.data,
      previousFlow: prevResult.data,
    };

    return { value: flow2 };
  },
};
```

### Subscribe System

Cross-bridge pub/sub that works with React Suspense. Key features:

- **suspend()**: Throws promise for Suspense boundaries
- **publish()**: Emit values to subscribers
- **add()**: Subscribe with callback
- **reset()**: Clear and optionally wait for new promise

Enables view updates to trigger React renders via subscription.

**Suspense Integration Details:**

**When Suspense is REQUIRED:**

- Using ManagedPlayer → REQUIRED
- ManagedPlayer throws promises during flow loading
- Without Suspense, throws unhandled promise error

**When Suspense is RECOMMENDED:**

- Using ReactPlayer with async flow fetching
- Using async asset data loading
- Better UX with loading states

**What happens without Suspense:**

- ManagedPlayer: Error (unhandled promise thrown)
- ReactPlayer: Works, but no loading state (component renders immediately)

**Suspense Boundary Placement:**

```typescript
// CORRECT: Suspense wraps ManagedPlayer
<Suspense fallback={<Loading />}>
  <ManagedPlayer manager={manager} />
</Suspense>

// INCORRECT: ManagedPlayer wraps Suspense
<ManagedPlayer manager={manager}>
  <Suspense fallback={<Loading />} />
</ManagedPlayer>

// GRANULAR: Multiple boundaries for better UX
<Suspense fallback={<AppLoading />}>
  <Header />
  <Suspense fallback={<ContentLoading />}>
    <ManagedPlayer manager={manager} />
  </Suspense>
  <Footer />
</Suspense>
```

### Context Providers

Two context systems:

- **PlayerContext**: Provides Player instance to component tree
- **AssetContext**: Provides asset registry to ReactAsset components

Access via `usePlayer()` and useContext(AssetContext).

### Plugin Architecture

Dual plugin system:

- **apply(player)**: Standard Player plugin (core hooks)
- **applyReact(reactPlayer)**: React-specific setup (registry, React hooks)

Plugins can implement either or both. React plugins extend ReactPlayerPlugin interface.

## API Surface

### ReactPlayer Class

**Constructor**:

```typescript
new ReactPlayer(options?: {
  player?: Player;           // Custom player instance
  plugins?: ReactPlayerPlugin[];
})
```

**Properties**:

- `player: Player` - Underlying headless player
- `assetRegistry: Registry<React.ComponentType>` - Asset-to-component map
- `Component: React.ComponentType` - Root render component
- `viewUpdateSubscription: Subscribe<View>` - View change pub/sub
- `hooks`: React-specific hooks (webComponent, playerComponent, onBeforeViewReset)

**Methods**:

- `start(flow: Flow): Promise<CompletedState>` - Execute flow
- `setWaitForNextViewUpdate(): Promise<void>` - Wait for next view update
- `findPlugin<T>(symbol): T | undefined` - Find plugin by symbol
- `registerPlugin(plugin: ReactPlayerPlugin)` - Add plugin post-construction
- `getPlayerVersion(): string` - Player version
- `getPlayerCommit(): string` - Git commit

**Hooks**:

- `webComponent: SyncWaterfallHook<[React.ComponentType]>` - Wrap root component
- `playerComponent: SyncWaterfallHook<[React.ComponentType]>` - Wrap player component
- `onBeforeViewReset: AsyncParallelHook<[]>` - Pre-reset async tasks

### useReactPlayer Hook

**Signature**:

```typescript
useReactPlayer(options?: ReactPlayerOptions): {
  reactPlayer: ReactPlayer;
  player: Player;
  playerState: PlayerFlowState;
}
```

**Purpose**: Primary integration hook. Creates stable ReactPlayer instance and provides reactive state.

**Usage**: Call once at flow container level. Pass plugins via options. State updates automatically on flow transitions.

### ManagedPlayer Component

**Props**:

```typescript
interface ManagedPlayerProps extends ReactPlayerOptions {
  manager: FlowManager;
  onStartedFlow?: () => void;
  onComplete?: (finalState?: CompletedState) => void;
  onError?: (e: Error) => void;
  fallbackComponent?: React.ComponentType<FallbackProps>;
}
```

**FlowManager Interface**:

```typescript
interface FlowManager {
  next(previousValue?: CompletedState): Promise<FinalState | NextState<Flow>>;
  terminate?(data?: any): void; // Called on unmount
}
```

**Behavior**:

- Requires Suspense boundary ancestor
- Calls `manager.next()` initially and after each flow completion
- Returns `{ done: true }` to end sequence, `{ value: flow }` to continue
- Handles errors with fallbackComponent (provides reset/restart)

### Hooks

**usePlayer()**:

```typescript
function usePlayer(): Player | undefined;
```

Access Player instance from context. Returns undefined if no PlayerContext.Provider ancestor.

**useLogger()**:

```typescript
function useLogger(): Logger;
```

Access logger from player context. Returns noop logger if no player.

**useAssetProps(asset)**:

```typescript
function useAssetProps(asset: Asset): {
  id: string;
  "data-asset-type": string;
};
```

Common DOM props for assets. Useful for wrapping assets with consistent attributes.

**useGetConstant(key)** / **useGetConstantByType(type, key)**:

```typescript
function useGetConstant(key: string): any;
function useGetConstantByType(type: string, key: string): any;
```

Access constants from player's ConstantsController.

### ReactAsset Component

**Props**: `Asset<string> | AssetWrapper<Asset<string>>`

**Behavior**:

1. Unwraps AssetWrapper to get asset
2. Looks up React component from AssetContext registry
3. Renders component with asset props
4. Wraps in ErrorBoundary with AssetRenderError tracking
5. Provides helpful error messages with Levenshtein distance suggestions for typos

**Error messages**:

- Empty registry: Suggests no plugins or mismatched React versions
- Missing asset type: Suggests similar registered types
- Tracks asset parent path for debugging nested errors

### ReactPlayerPlugin Interface

```typescript
interface ReactPlayerPlugin extends Partial<PlayerPlugin> {
  name: string;
  applyReact?: (reactPlayer: ReactPlayer) => void;
  apply?: (player: Player) => void;
}
```

**Pattern**: Implement `applyReact` for React-specific setup (registry registration), `apply` for core player setup (validators, expressions, etc.).

### Subscribe Class

**Methods**:

- `publish(val: T): Promise<void>` - Emit value to subscribers
- `add(callback: (val?: T) => void, options?): SubscribeID` - Subscribe
- `remove(id: SubscribeID): void` - Unsubscribe
- `reset(promise?: Promise<void>): Promise<void>` - Clear and reset
- `suspend(): T` - Throw promise for Suspense (blocks until publish)
- `get(): T | undefined` - Get current value without suspending

## Common Usage Patterns

### Basic Player Setup

**When to use**: Simple single-flow React integration.

**Approach**:

1. Call `useReactPlayer({ plugins })` at container level
2. Call `reactPlayer.start(flowJSON)` in useEffect
3. Render `<reactPlayer.Component />` in JSX
4. Handle playerState for loading/error states

**Example pattern**:

```typescript
const App = () => {
  const { reactPlayer, playerState } = useReactPlayer({
    plugins: [new ReferenceAssetsPlugin()]
  });

  React.useEffect(() => {
    reactPlayer.start(myFlow);
  }, []);

  if (playerState.status === "error") {
    return <ErrorUI error={playerState.error} />;
  }

  return <reactPlayer.Component />;
};
```

**Considerations**: reactPlayer instance is stable (useMemo), safe to use in deps array. Call start() in effect to avoid re-renders.

### Multi-Flow Experiences (ManagedPlayer)

**When to use**: Wizard flows, multi-step processes, flow sequences.

**Approach**:

1. Implement FlowManager interface with `next()` method
2. Return `{ value: flow }` to continue, `{ done: true }` to end
3. Wrap ManagedPlayer in Suspense boundary
4. Provide fallbackComponent for error handling
5. Optionally implement `terminate()` for cleanup

**FlowManager pattern**:

```typescript
const manager: FlowManager = {
  async next(prevResult) {
    if (!prevResult) {
      return { value: await fetchFlow1() };
    }
    if (prevResult.data.continue) {
      return { value: await fetchFlow2(prevResult.data) };
    }
    return { done: true };
  },
  terminate(data) {
    // Save state on unmount
  }
};

<Suspense fallback={<Loading />}>
  <ManagedPlayer
    manager={manager}
    plugins={plugins}
    onComplete={(state) => console.log('Done', state)}
    fallbackComponent={ErrorScreen}
  />
</Suspense>
```

**Considerations**: Suspense boundary required. Manager can throw to trigger error boundary. Use prevResult.data to pass state between flows.

### Custom Asset Registration

**When to use**: Mapping custom asset types to React components.

**Approach**:

1. Create React component accepting asset props
2. Register via plugin's applyReact method
3. Use reactPlayer.assetRegistry.set(matcher, Component)
4. Matcher can be string or object for partial matching

**Registration patterns**:

```typescript
const MyPlugin: ReactPlayerPlugin = {
  name: "my-plugin",
  applyReact(rp) {
    // Exact match
    rp.assetRegistry.set({ type: "my-asset" }, MyAssetComponent);

    // Partial match (matches "action-*")
    rp.assetRegistry.set({ type: "action" }, ActionComponent);

    // Object match
    rp.assetRegistry.set({ type: "button", variant: "primary" }, PrimaryButton);
  },
};
```

**Considerations**: Later registrations override earlier ones. Partial match is prefix-based. Registry uses first matching component.

### Using Player in Custom Assets

**When to use**: Asset components need to access data, trigger transitions, or interact with Player.

**Approach**:

1. Use `usePlayer()` hook in component
2. Access controllers via `player.getState()`
3. Check state.status === "in-progress" before controller access
4. Use controllers for data reads/writes, transitions, validation

**Component pattern**:

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

**Considerations**: usePlayer returns undefined if no provider. Always null-check and status-check before controller access.

### Error Handling and Boundaries

**When to use**: Gracefully handling asset rendering errors.

**Built-in behavior**:

- ReactAsset wraps each asset in ErrorBoundary
- AssetRenderError tracks parent asset path
- Helpful error messages with suggestions

**Custom error handling**:

```typescript
reactPlayer.hooks.webComponent.tap('error-handler', (Comp) => {
  return () => (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, errorInfo);
      }}
      fallback={<ErrorFallback />}
    >
      <Comp />
    </ErrorBoundary>
  );
});
```

**Considerations**: Errors bubble up asset tree. AssetRenderError has getAssetPathMessage() for debugging. Check for Levenshtein suggestions in error messages.

### Wrapping Root Component

**When to use**: Adding global providers, error boundaries, or styling wrappers.

**Approach**:

1. Tap `reactPlayer.hooks.webComponent`
2. Return wrapper component that renders children
3. Hook receives current component, returns new wrapper

**Pattern**:

```typescript
reactPlayer.hooks.webComponent.tap('wrapper', (Comp) => {
  return (props) => (
    <ThemeProvider>
      <ErrorBoundary>
        <Comp {...props} />
      </ErrorBoundary>
    </ThemeProvider>
  );
});
```

**Considerations**: Waterfall hook—each tap wraps previous. Order matters. Inner taps execute first.

## Dependencies

- **@player-ui/player**: Core headless engine (re-exported)
- **@player-ui/types**: Type definitions (re-exported)
- **@player-ui/partial-match-registry**: Asset registry implementation
- **@player-ui/react-subscribe**: Subscribe system for Suspense
- **react** (peer): React 16.8+ (hooks required)
- **tapable-ts**: Hook system
- **leven**: Levenshtein distance for error suggestions
- **use-sync-external-store**: React 18 concurrent-safe subscriptions

## Integration Points

### Asset Registry

Partial-match Registry enables flexible type mapping:

- Exact matches take precedence
- Prefix-based partial matching
- Object property matching
- Extensible via plugins

### Suspense Integration

Subscribe system throws promises for Suspense:

- viewUpdateSubscription.suspend() blocks until publish
- ManagedPlayer uses Suspense for flow loading
- Custom Suspense boundaries for granular loading states

### Error Boundaries

Asset-level error isolation:

- Each ReactAsset wrapped in ErrorBoundary
- AssetRenderError tracks error propagation path
- Helpful error messages with type suggestions

### Context Providers

Two-layer context system:

- PlayerContext: Provides Player to tree
- AssetContext: Provides registry to ReactAsset

### Hook System

Extends Player hooks with React-specific:

- webComponent: Wrap entire player UI
- playerComponent: Wrap individual views
- onBeforeViewReset: Async cleanup before view change

## Common Pitfalls

1. **Missing Suspense boundary for ManagedPlayer**: ManagedPlayer requires Suspense ancestor or will throw unhandled promise. Wrap in `<Suspense fallback={...}>`.

2. **Asset registry registration timing**: Register assets via plugins in constructor or before first render. Post-render registration won't affect current view.

3. **usePlayer returns undefined**: Hook requires PlayerContext.Provider ancestor. Check for undefined before accessing player methods.

4. **Asset type mismatches**: Check error message for Levenshtein suggestions. Typos like "botton" suggest "button". Case-sensitive matching.

5. **Plugin apply vs applyReact confusion**: Core Player hooks go in `apply()`, React-specific (registry) goes in `applyReact()`. Both optional but at least one required.

6. **Reactive state not updating**: Use playerState from useReactPlayer, not player.getState(). playerState triggers re-renders, getState() doesn't.

7. **Multiple ReactPlayer instances**: Don't create multiple ReactPlayers for same flow. Use one instance, restart with new flow if needed.

8. **Accessing controllers in assets without state check**: Always check `state?.status === 'in-progress'` before accessing controllers. Before flow starts or after completion, controllers unavailable.

9. **Subscribe suspend timing**: suspend() throws if no value published yet. Ensure publish() called before render or wrap in try-catch.

10. **FlowManager next() promise rejection**: Unhandled rejections in manager.next() crash ManagedPlayer. Use try-catch or provide fallbackComponent.

11. **Context provider nesting**: PlayerContext must wrap components using usePlayer. AssetContext auto-provided by ReactPlayer.Component.

12. **Hook stability in useReactPlayer**: reactPlayer instance stable (useMemo), safe in dependency arrays. Don't recreate on every render.

## Testing with ReactPlayer

**Testing Custom Assets:**

```typescript
import { render } from '@testing-library/react';
import { PlayerContext } from '@player-ui/react';

test('custom asset renders', () => {
  const mockPlayer = {
    getState: () => ({ status: 'in-progress', controllers: {} }),
    hooks: { state: { tap: () => {} } }
  };

  const { getByText } = render(
    <PlayerContext.Provider value={mockPlayer}>
      <MyCustomAsset label="Test" />
    </PlayerContext.Provider>
  );

  expect(getByText('Test')).toBeInTheDocument();
});
```

**Mocking ReactPlayer:**

```typescript
import { Registry } from '@player-ui/partial-match-registry';

function createMockReactPlayer() {
  return {
    player: createMockPlayer(),
    assetRegistry: new Registry(),
    viewUpdateSubscription: {
      publish: vi.fn(),
      add: vi.fn(),
      suspend: () => null,
    },
    Component: () => <div>Mock Player</div>,
  };
}
```

**Testing ManagedPlayer:**

```typescript
import { render, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

test('managed player completes flow sequence', async () => {
  const manager = {
    next: vi.fn()
      .mockResolvedValueOnce({ value: flow1 })
      .mockResolvedValueOnce({ value: flow2 })
      .mockResolvedValueOnce({ done: true }),
  };

  const onComplete = vi.fn();

  render(
    <Suspense fallback={<div>Loading</div>}>
      <ManagedPlayer
        manager={manager}
        onComplete={onComplete}
        plugins={[]}
      />
    </Suspense>
  );

  await waitFor(() => {
    expect(manager.next).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenCalled();
  });
});
```

**Testing Async Flows:**

```typescript
import { waitFor, findByText } from '@testing-library/react';

test('handles async flow loading', async () => {
  const { findByText } = render(
    <Suspense fallback={<div>Loading...</div>}>
      <ReactPlayerWithAsyncFlow />
    </Suspense>
  );

  // Suspense fallback shows while loading
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // Wait for flow to load and render
  await findByText('Flow Content');
});
```

**Testing Asset Interactions:**

```typescript
test('asset updates data model', () => {
  const mockDataController = {
    set: vi.fn(),
    get: vi.fn(),
  };

  const mockPlayer = {
    getState: () => ({
      status: 'in-progress',
      controllers: { data: mockDataController },
    }),
  };

  const { getByRole } = render(
    <PlayerContext.Provider value={mockPlayer}>
      <InputAsset binding="user.name" />
    </PlayerContext.Provider>
  );

  const input = getByRole('textbox');
  fireEvent.change(input, { target: { value: 'John' } });

  expect(mockDataController.set).toHaveBeenCalledWith([
    ['user.name', 'John']
  ]);
});
```

**Testing Error Boundaries:**

```typescript
test('handles asset render errors', () => {
  const ThrowingAsset = () => {
    throw new Error('Render failed');
  };

  const { getByText } = render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowingAsset />
    </ErrorBoundary>
  );

  expect(getByText('Error occurred')).toBeInTheDocument();
});
```

## Reference Files

- `/react/player/src/player.tsx` - ReactPlayer class
- `/react/player/src/hooks.tsx` - useReactPlayer hook
- `/react/player/src/manager/managed-player.tsx` - ManagedPlayer component
- `/react/player/src/manager/types.ts` - FlowManager interface
- `/react/player/src/asset/index.tsx` - ReactAsset component and registry
- `/react/player/src/asset/AssetRenderError.ts` - AssetRenderError class
- `/react/player/src/app.tsx` - ReactPlayer component (simple view renderer)
- `/react/player/src/utils/player-context.ts` - PlayerContext and usePlayer
- `/react/subscribe/src/index.tsx` - Subscribe system

## Performance Considerations

- **Asset registry lookups**: O(n) partial-match search. Keep registry small or use exact matches for hot paths.
- **View update subscriptions**: Only triggers re-renders when view actually changes. Efficient by default.
- **Context updates**: PlayerContext rarely updates (only on flow start/end). AssetContext static per ReactPlayer instance.
- **Suspense boundaries**: Granular boundaries reduce blocked components. Wrap individual slow-loading sections.
- **ManagedPlayer flow transitions**: Each flow creates new ReactPlayer. Reuse expensive plugins across instances if possible (pass same player instance).
- **Error boundary overhead**: Per-asset boundaries minimal overhead. Don't add additional boundaries unless needed.

## TypeScript Support

Fully typed with generics for:

- Asset types: `ReactPlayer<MyAsset>`
- Flow types: `Flow<MyAsset>`
- Plugin types: Type-safe hook tapping
- Registry types: Typed component matching

Use type parameter to enforce asset structure across flow authoring and React components.
