//
//  SwiftUIPlayer+Context.swift
//  PlayerUI
//

import Combine
import JavaScriptCore
import PlayerUI
import PlayerUILogger
import SwiftHooks
import SwiftUI

public extension SwiftUIPlayer {
    /// A SwiftUIPlayer Context maintains the current javascript state of Player. This includes
    /// providing
    /// stable storage for Player JSValue across SwiftUI View updates.
    ///
    final class Context: ObservableObject {
        /// A global context that can be managed by a single SwiftUIPlayer at a time. This may be
        /// useful
        /// for fullscreen player views when @StateObject is not available to the host application.
        public static let shared: Context = .init()

        public let logger: TapableLogger = .init()

        fileprivate(set) var hooks: SwiftUIPlayerHooks?

        private(set) var player: JSValue?
        let registry: SwiftUIRegistry = .init()

        @Published private(set) var result: Result<CompletedState, PlayerError>?

        private var contextBuilder: () -> JSContext
        private let partialMatchPlugin: PartialMatchFingerprintPlugin = .init()
        /// Plugins applied to the currently loaded context, held weakly so this (possibly
        /// global) context doesn't extend their lifetime. Torn down on `unload()`/next `load()`.
        private var activePlugins: [WeakPlugin] = []
        private var flow: String?
        private var registryWatch: AnyCancellable?
        private var state: BaseFlowState?

        /// Returns true iff there is a non-nil player.
        public var isLoaded: Bool {
            player != nil
        }

        /// Returns `player` but asserts that it is not nil. Used from methods that should not be
        /// called
        /// when we are unloaded.
        private var expectedPlayer: JSValue? {
            assert(player != nil, "should have a player value here")
            return player
        }

        /// Create a new context that generates JSContexts using the supplied contextBuilder.
        public init(contextBuilder: @escaping () -> JSContext = { JSContext() }) {
            self.contextBuilder = contextBuilder
            registryWatch = registry.objectWillChange.sink { [weak self] in
                // Send synchronously when already on main, so the signal fires on the same
                // runloop tick as the mutation instead of a tick late via an unconditional hop.
                if Thread.isMainThread {
                    // added MainActor.assumeIsolated (main-actor isolation) for future, when this
                    // module adopts Swift 6 strict concurrency checking.
                    MainActor.assumeIsolated {
                        self?.objectWillChange.send()
                    }
                } else {
                    Task { @MainActor in
                        self?.objectWillChange.send()
                    }
                }
            }
        }

        /// Load the supplied flow into this context. If the currently loaded flow is supplied this
        /// will do nothing.
        /// If a new flow is supplied then the javascript environment is created or rebuilt around
        /// the new flow.
        func load(
            flow: String,
            plugins: [NativePlugin],
            player: SwiftUIPlayer,
            startOptions: StartOptions? = nil
        ) {
            registry.logger = logger
            guard self.player == nil || flow != self.flow else {
                logger.d("Reusing already loaded flow")
                return
            }

            // A previous flow loaded without `unload()` leaves its plugins pointing at its
            // context. Run the same teardown as `unload()` so both paths leave identical
            // state (plugins, player, hooks, flow-state) before building the new context.
            teardownLoadedContext()

            let context: JSContext = contextBuilder()

            let allPlugins = plugins + [partialMatchPlugin]
            // Track before setup: setupPlayer wires each JSBasePlugin to `context` as it
            // goes, so on failure those refs still need tearing down.
            activePlugins = allPlugins.map(WeakPlugin.init)
            guard let playerValue = player.setupPlayer(context: context, plugins: allPlugins) else {
                logger.e("Failed to load player")
                return abandonFailedLoad(context: context)
            }

            let hooks = SwiftUIPlayerHooks(from: playerValue)

            self.player = playerValue
            self.flow = flow
            self.hooks = hooks
            Task { @MainActor [weak self] in
                self?.result = nil
            }

            for plugin in allPlugins {
                plugin.apply(player: player)
            }
            registry.partialMatchRegistry = partialMatchPlugin

            hooks.viewController.tap { [weak self, weak playerValue] controller in
                guard let self, let playerValue, self.player == playerValue else { return }
                onViewController(controller)
            }

            hooks.state.tap { [weak self, weak playerValue] newState in
                Task { @MainActor [weak self] in
                    guard let self, let playerValue, self.player == playerValue else { return }
                    state = newState
                }
            }

            guard !flow.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                logger.d("Empty flow, not loading")
                return
            }

            // swiftlint:disable closure_parameter_position
            player.start(flow: flow, options: startOptions) { [
                weak self,
                weak playerValue
            ] result in
                guard let self, let playerValue, self.player == playerValue else { return }
                Task { @MainActor [weak self] in
                    self?.result = result
                }
            }
            // swiftlint:enable closure_parameter_position
        }

        /// Unload the context. Releases the current JS player/context and clears the current
        /// result, including the context's exception handler and `setTimeout`.
        public func unload() {
            teardownLoadedContext()
            Task { @MainActor [weak self] in
                self?.result = nil
            }
            registry.resetView()
        }

        /// Cleans up after `setupPlayer` fails in `load()`. It may have already connected the
        /// plugins, `setTimeout`, and the exception handler to `context` before failing, so
        /// clear them, then finish fully unloaded instead of half set up.
        private func abandonFailedLoad(context: JSContext) {
            autoreleasepool {
                teardownActivePlugins()
                context.exceptionHandler = nil
                context.setObject(nil, forKeyedSubscript: JSUtilities.setTimeoutKey)
                JSGarbageCollect(context.jsGlobalContextRef)
            }
            unload()
        }

        /// Releases everything tied to the loaded JS context:
        /// - plugin references into the context
        /// - the JS player, hooks, and flow state
        /// - the context's exception handler and `setTimeout`
        ///
        /// Used by both `unload()` and `load()`, since `load()` can replace a loaded flow
        /// without `unload()` being called first. Safe to call when nothing is loaded.
        private func teardownLoadedContext() {
            // Drain autoreleased temporaries (e.g. from `JSValue.context`) now, so they
            // don't keep the JSContext alive until the next run loop.
            autoreleasepool {
                if let ctx = player?.context {
                    ctx.exceptionHandler = nil
                    ctx.setObject(nil, forKeyedSubscript: JSUtilities.setTimeoutKey)
                    JSGarbageCollect(ctx.jsGlobalContextRef)
                }
                // Break plugin → JSContext/JSValue references, including caller-supplied
                // plugins, so a late callback can't reach the now-torn-down context.
                teardownActivePlugins()
                // Release the JS player instance and all hook JSValues
                player = nil
                hooks = nil
                flow = nil
                // Release InProgressState which holds PlayerControllers (JSValues)
                state = nil
            }
        }

        private func teardownActivePlugins() {
            // Teardown races late JS-invoking callbacks (e.g. a delayed beacon) unless both
            // stay on the main thread, where Player invokes plugins.
            assert(Thread.isMainThread, "plugin teardown must run on the main thread")
            activePlugins.forEach { $0.plugin?.teardown() }
            activePlugins = []
        }

        /// Clear the exceptionHandler of the context to remove reference to the logger
        /// should be called when ManagedPlayer gets tore down
        public func clearExceptionHandler() {
            player?.context.exceptionHandler = nil
        }

        /// Handler for when the ViewController in the core player changes
        /// - parameters:
        ///   - viewController: The new ViewController instance
        private func onViewController(_ viewController: ViewController) {
            viewController.hooks.view.tap { [weak self, weak expectedPlayer] view in
                guard let self, let expectedPlayer, player == expectedPlayer else { return }
                onView(view)
            }
        }

        /// Handler for when the View changes in the ViewController
        /// - parameters:
        ///   - view: The new View in the ViewController
        private func onView(_ view: PlayerView) {
            view.hooks.onUpdate.tap { [weak self, weak expectedPlayer] value in
                Task { @MainActor [weak self] in
                    guard let self, let expectedPlayer,
                          player == expectedPlayer else { return }
                    onUpdate(value)
                }
            }
        }

        /// Handler for when there is an update to the asset tree in the current `PlayerView`
        /// - parameters:
        ///   - value: JSValue that is the root of the resolved asset tree
        private func onUpdate(_ value: JSValue) {
            JSGarbageCollect(value.context.jsGlobalContextRef)
            do {
                try registry.decode(value: value)
            } catch {
                (state as? InProgressState)?.controllers?.error.captureError(error: error)
            }
        }
    }
}
