//
//  SwiftUIPlayer.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/26/21.
//

import Combine
import JavaScriptCore
import PlayerUI
import PlayerUILogger
import SwiftHooks
import SwiftUI

/// A `HeadlessPlayer` implementation that renders itself as a SwiftUI View
public struct SwiftUIPlayer: View, HeadlessPlayer {
    /// For ViewInspector testing
    let inspection: Inspection<Self> = .init()

    private let unloadOnDisappear: Bool

    @ObservedObject private var context: Context
    @Binding private var result: Result<CompletedState, PlayerError>?

    /// The SwiftUI View that is this Player flow
    public var body: some View {
        bodyContent
            .environment(\.inProgressState, (state as? InProgressState))
            .environment(\.constantsController, constantsController)
            // forward results from our Context along to our result binding
            .onReceive(context.$result.debounce(for: 0.1, scheduler: RunLoop.main)) {
                result = $0
            }
            .onReceive(inspection.notice) { inspection.visit(self, $0) }
            .onDisappear {
                guard unloadOnDisappear else { return }
                context.unload()
            }
    }

    private var bodyContent: some View {
        bodyContent(hooks?.transition.call() ?? .identity)
    }

    /// A reference to the shared logger
    public var logger: TapableLogger {
        context.logger
    }

    /// A read only reference to the platform shared core player value in the `JSContext`
    public var jsPlayerReference: JSValue? {
        context.player
    }

    /// Lifecycle hooks exposed from the platform shared core player
    public var hooks: SwiftUIPlayerHooks? {
        context.hooks
    }

    /// The registry for registering assets to be used for rendering
    public var assetRegistry: SwiftUIRegistry {
        context.registry
    }

    /// Constructs a `SwiftUIPlayer` with the given flow and plugins
    /// - parameters:
    ///   - flow: The JSON flow to run
    ///   - plugins: Any plugins to add to Player
    ///   - context: An optional JSContext to use for loading platform shared code
    ///   - startOptions: Describes the content `format`/`version`. Defaults to `nil` (a Player
    /// `Flow`).
    ///      Pass e.g. `.a2ui` to start a non-Player content format claimed by a plugin.
    public init(
        flow: String,
        plugins: [NativePlugin],
        result: Binding<Result<CompletedState, PlayerError>?>,
        context: Context = .shared,
        unloadOnDisappear: Bool = true,
        startOptions: StartOptions? = nil
    ) {
        let startTime = Date()
        _result = result
        _context = ObservedObject(initialValue: context)
        self.unloadOnDisappear = unloadOnDisappear
        context.load(flow: flow, plugins: plugins, player: self, startOptions: startOptions)

        // Log the time it took to initialize Player
        let initTime = Int((Date().timeIntervalSince(startTime) * 1000).rounded())
        context.logger.i("SwiftUIPlayer initialized in \(initTime) ms.")
    }

    private func bodyContent(_ transitionInfo: PlayerViewTransition) -> some View {
        // use a VStack to provide a container for our view transitions to run inside
        VStack {
            hooks?.view
                .call(context.registry.root?.view ?? AnyView(Color.clear))
                .transition(transitionInfo.transition)
                .id(context.registry.root?.id)
        }
        // only apply our transition animation when the root view is changing
        .animation(transitionInfo.animationCurve, value: context.registry.root?.id)
    }
}

extension SwiftUIPlayer {
    /// For testing, uses a constant result of nil.
    init(flow: String, plugins: [NativePlugin], context: SwiftUIPlayer.Context = .init()) {
        self.init(flow: flow, plugins: plugins, result: .constant(nil), context: context)
    }
}
