//
//  SwiftUIPlayer.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

import SwiftUI
import JavaScriptCore
import Combine
import SwiftHooks

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUILogger
#endif

/**
 A `HeadlessPlayer` implementation that renders itself as a SwiftUI View
 */
public struct SwiftUIPlayer: View, HeadlessPlayer {
    /// A SwiftUIPlayer Context maintains the current javascript state of Player. This includes providing
    /// stable storage for Player JSValue across SwiftUI View updates.
    ///
    public final class Context: ObservableObject {
        /// A global context that can be managed by a single SwiftUIPlayer at a time. This may be useful
        /// for fullscreen player views when @StateObject is not available to the host application.
        public static let shared = Context()

        private var contextBuilder: () -> JSContext
        private let partialMatchPlugin = PartialMatchFingerprintPlugin()
        public let logger = TapableLogger()
        private var flow: String?
        private var registryWatch: AnyCancellable?
        private var state: BaseFlowState?

        fileprivate var player: JSValue?
        fileprivate(set) var hooks: SwiftUIPlayerHooks?
        fileprivate let registry = SwiftUIRegistry()

        @Published fileprivate var result: Result<CompletedState, PlayerError>?

        /// Returns true iff there is a non-nil player. 
        public var isLoaded: Bool { player != nil }

        /// Create a new context that generates JSContexts using the supplied contextBuilder.
        public init(contextBuilder: @escaping () -> JSContext = { JSContext() }) {
            self.contextBuilder = contextBuilder
            registryWatch = registry.objectWillChange.sink { [weak self] in
                DispatchQueue.main.async {
                    self?.objectWillChange.send()
                }
            }
        }

        /// Load the supplied flow into this context. If the currently loaded flow is supplied this will do nothing.
        /// If a new flow is supplied then the javascript environment is created or rebuilt around the new flow.
        fileprivate func load(flow: String, plugins: [NativePlugin], player: SwiftUIPlayer) {
            registry.logger = logger
            guard self.player == nil || flow != self.flow else {
                logger.d("Reusing already loaded flow")
                return
            }

            let context: JSContext = contextBuilder()

            let allPlugins = plugins + [partialMatchPlugin]
            guard let playerValue = player.setupPlayer(context: context, plugins: allPlugins) else {
                return logger.e("Failed to load player")
            }

            let hooks = SwiftUIPlayerHooks(from: playerValue)

            self.player = playerValue
            self.flow = flow
            self.hooks = hooks
            DispatchQueue.main.async { self.result = nil }

            for plugin in allPlugins { plugin.apply(player: player) }
            registry.partialMatchRegistry = partialMatchPlugin

            hooks.viewController.tap { [weak self] controller in
                guard let self = self, self.player == playerValue else { return }
                self.onViewController(controller)
            }

            hooks.state.tap { [weak self] newState in
                self?.state = newState
            }

            guard !flow.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                logger.d("Empty flow, not loading")
                return
            }

            player.start(flow: flow) { [weak self] (result) in
                guard let self = self, self.player == playerValue else { return }
                DispatchQueue.main.async { self.result = result }
            }
        }

        /// Unload the context. This will release the current javascript player/context and clear the current
        /// result.
        public func unload() {
            player = nil
            hooks = nil
            flow = nil
            DispatchQueue.main.async { self.result = nil }
            registry.resetView()
        }

        /// Clear the exceptionHandler of the context to remove reference to the logger
        /// should be called when ManagedPlayer gets tore down
        public func clearExceptionHandler() {
            player?.context.exceptionHandler = nil
        }

        /// Returns `player` but asserts that it is not nil. Used from methods that should not be called
        /// when we are unloaded.
        private var expectedPlayer: JSValue? {
            assert(player != nil, "should have a player value here")
            return player
        }

        /**
         Handler for when the ViewController in the core player changes
         - parameters:
            - viewController: The new ViewController instance
         */
        private func onViewController(_ viewController: ViewController) {
            let playerValue = expectedPlayer
            viewController.hooks.view.tap { [weak self] view in
                guard let self = self, self.player == playerValue else { return }
                self.onView(view)
            }
        }

        /**
         Handler for when the View changes in the ViewController
         - parameters:
            - view: The new View in the ViewController
         */
        private func onView(_ view: PlayerView) {
            let playerValue = expectedPlayer
            view.hooks.onUpdate.tap { [weak self] value in
                Task { @MainActor in
                    guard let self = self, self.player == playerValue else { return }
                    self.onUpdate(value)
                }
            }
        }

        /**
         Handler for when there is an update to the asset tree in the current `PlayerView`
         - parameters:
            - value: JSValue that is the root of the resolved asset tree
         */
        private func onUpdate(_ value: JSValue) {
            JSGarbageCollect(value.context.jsGlobalContextRef)
            do {
                try registry.decode(value: value)
            } catch {
                (state as? InProgressState)?.fail(PlayerError.unknownResponse(error))
            }
        }
    }

    @ObservedObject private var context: Context
    @Binding private var result: Result<CompletedState, PlayerError>?
    private let unloadOnDisappear: Bool
    /// A reference to the shared logger
    public var logger: TapableLogger { context.logger }

    /// A read only reference to the platform shared core player value in the `JSContext`
    public var jsPlayerReference: JSValue? { context.player }

    /// Lifecycle hooks exposed from the platform shared core player
    public var hooks: SwiftUIPlayerHooks? { context.hooks }

    /// The registry for registering assets to be used for rendering
    public var assetRegistry: SwiftUIRegistry { context.registry }

    // For ViewInspector testing
    internal let inspection = Inspection<Self>()

    /**
     Constructs a `SwiftUIPlayer` with the given flow and plugins
     - parameters:
        - flow: The JSON flow to run
        - plugins: Any plugins to add to Player
        - context: An optional JSContext to use for loading platform shared code
     */
    public init(
        flow: String,
        plugins: [NativePlugin],
        result: Binding<Result<CompletedState, PlayerError>?>,
        context: Context = .shared,
        unloadOnDisappear: Bool = true
    ) {
        self._result = result
        self._context = ObservedObject(initialValue: context)
        self.unloadOnDisappear = unloadOnDisappear
        context.load(flow: flow, plugins: plugins, player: self)
    }

    /// The SwiftUI View that is this Player flow
    public var body: some View {
        bodyContent
            .environment(\.inProgressState, (state as? InProgressState))
            .environment(\.constantsController, constantsController)
            // forward results from our Context along to our result binding
            .onReceive(context.$result.debounce(for: 0.1, scheduler: RunLoop.main)) {
                self.result = $0
            }
            .onReceive(inspection.notice) { self.inspection.visit(self, $0) }
            .onDisappear {
                guard unloadOnDisappear else { return }
                context.unload()
            }
    }

    private var bodyContent: some View {
        bodyContent(hooks?.transition.call() ?? .identity)
    }

    private func bodyContent(_ transitionInfo: PlayerViewTransition) -> some View {
        // use a VStack to provide a container for our view transitions to run inside
        VStack {
            hooks?.view.call(context.registry.root?.view ?? AnyView(Color.clear))
                .transition(transitionInfo.transition)
                .id(context.registry.root?.id)
        }
        // only apply our transition animation when the root view is changing
        .animation(transitionInfo.animationCurve, value: context.registry.root?.id)
    }
}

/// EnvironmentKey for storing `InProgressState`
struct InProgressStateKey: EnvironmentKey {
    /// The default value for `@Environment(\.inProgressState)`
    static var defaultValue: InProgressState?
}

/// EnvironmentKey for storing `constantsController`
struct ConstantsControllerStateKey: EnvironmentKey {
    /// The default value for `@Environment(\.constantsController)`
    static var defaultValue: ConstantsController? = nil
}

public extension EnvironmentValues {
    /// The `InProgressState` of Player if it is in progress, and in scope
    var inProgressState: InProgressState? {
        get { self[InProgressStateKey.self] }
        set { self[InProgressStateKey.self] = newValue }
    }
    
    /// The ConstantsController reference of Player
    var constantsController: ConstantsController? {
        get { self[ConstantsControllerStateKey.self] }
        set { self[ConstantsControllerStateKey.self] = newValue }
    }
}

internal extension SwiftUIPlayer {
    /// For testing, uses a constant result of nil.
    init(flow: String, plugins: [NativePlugin], context: SwiftUIPlayer.Context = .init()) {
        self.init(flow: flow, plugins: plugins, result: .constant(nil), context: context)
    }
}

/**
 Lifecycle hooks for `SwiftUIPlayer`
 */
public struct SwiftUIPlayerHooks: CoreHooks {
    /// Fired when the FlowController changes
    public var flowController: Hook<FlowController>

    /// Fired when the ViewController changes
    public var viewController: Hook<ViewController>

    /// Fired when the DataController changes
    public var dataController: Hook<DataController>

    /// Fired when the state changes
    public var state: Hook<BaseFlowState>

    /// A hook to modify the view or add environment objects before it is rendered
    public var view: SyncWaterfallHook<AnyView>

    /// Provide Transition Animation information for transition views in the same flow
    public var transition: SyncBailHook<Void, PlayerViewTransition>

    /// Provides access to the current flow
    public var onStart: Hook<FlowType>

    /// Initialize hooks from reference to javascript core player
    public init(from player: JSValue) {
        flowController = Hook<FlowController>(baseValue: player, name: "flowController")
        viewController = Hook<ViewController>(baseValue: player, name: "viewController")
        dataController = Hook<DataController>(baseValue: player, name: "dataController")
        state = Hook<BaseFlowState>(baseValue: player, name: "state")
        view = SyncWaterfallHook<AnyView>()
        transition = SyncBailHook<Void, PlayerViewTransition>()
        onStart = Hook<FlowType>(baseValue: player, name: "onStart")
    }
}

/**
 Holds information needed for transition animations when a new view in a flow is being shown
 */
public struct PlayerViewTransition: Equatable {
    public static let identity = PlayerViewTransition(name: .identity, transition: .identity, animationCurve: .default)

    public static func == (lhs: Self, rhs: Self) -> Bool {
        lhs._transition == rhs._transition && lhs.animationCurve == rhs.animationCurve
    }

    private var _transition: Transition
    /// The transition to show the new view with
    public var transition: AnyTransition { _transition.transition }
    /// The animation curve to use for the transition
    public var animationCurve: Animation

    /**
     Creates a new `PlayerViewTransition`
     - parameters:
        - transition: The transition to show the new view with
        - animationCurve: The animation curve to use for the transition
     */
    public init(
        transition: AnyTransition,
        animationCurve: Animation
    ) {
        self._transition = .unnamed(transition)
        self.animationCurve = animationCurve
    }

    /**
     Creates a new `PlayerViewTransition`
     - parameters:
        - transition: The transition to show the new view with
        - animationCurve: The animation curve to use for the transition
     */
    public init(
        name: Name,
        transition: AnyTransition,
        animationCurve: Animation
    ) {
        self._transition = .named(name, transition)
        self.animationCurve = animationCurve
    }

    /// Name mostly exists as a way to allow testing of transition hooks.
    public struct Name: RawRepresentable {
        public static let identity = Name(rawValue: "identity")

        public let rawValue: String

        public init(rawValue: String) {
            self.rawValue = rawValue
        }
    }

    private enum Transition: Equatable {
        public static func == (lhs: Self, rhs: Self) -> Bool {
            switch (lhs, rhs) {
            case (.named(let lName, _), .named(let rName, _)): return lName == rName
            default:                                           return false
            }
        }

        case named(Name, AnyTransition)
        case unnamed(AnyTransition)

        var transition: AnyTransition {
            switch self {
            case .named(_, let transition): return transition
            case .unnamed(let transition):  return transition
            }
        }
    }
}

extension InProgressState: ObservableObject {}
