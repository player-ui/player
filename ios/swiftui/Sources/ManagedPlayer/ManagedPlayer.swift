//
//  ManagedPlayer.swift
//  CocoaLumberjack
//
//  Created by Harris Borawski on 3/26/21.
//

import Foundation
import SwiftUI
import Combine
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

/**
 An error type for errors from `ManagedPlayer`
 */
public enum ManagedPlayerError: Error {
    /// An error if the flow was received from the `FlowManager` but was empty
    case emptyFlow
}

/**
 A wrapper around the `SwiftUIPlayer` that uses a `FlowManager` to proceed through multi-flow experiences
 */
public struct ManagedPlayer<Loading: View, Fallback: View>: View {
    private var plugins: [NativePlugin]
    private var flowManager: FlowManager?
    @ObservedObject private var context: SwiftUIPlayer.Context

    private var loading: () -> Loading
    private var fallback: (ManagedPlayerErrorContext) -> Fallback
    private var viewModel: ManagedPlayerViewModel

    private var handleScroll: Bool

    // For ViewInspector testing
    internal let inspection = Inspection<Self>()

    /**
     Creates a `ManagedPlayer`
     - parameters:
        - plugins: The plugins to use for the `SwiftUIPlayer`
        - viewModel: The `ManagedPlayerViewModel` to use for fetching flows
        - handleScroll: Whether or not the `ManagedPlayer` should wrap content in a `ScrollView`
        - onError: A handler for when the `SwiftUIPlayer` encounters an error
        - loading: A closure providing a `View` to display while the `FlowManager` fetches flows
     */
    public init(
        plugins: [NativePlugin],
        context: SwiftUIPlayer.Context = .sharedManaged,
        viewModel: ManagedPlayerViewModel,
        handleScroll: Bool = true,
        @ViewBuilder fallback: @escaping (ManagedPlayerErrorContext) -> Fallback,
        @ViewBuilder loading: @escaping () -> Loading
    ) {
        self.plugins = plugins
        self.context = context
        self.loading = loading
        self.fallback = fallback
        self.viewModel = viewModel
        self.handleScroll = handleScroll
        plugins.apply(viewModel)
    }

    /**
     Creates a `ManagedPlayer`
     - parameters:
        - plugins: The plugins to use for the `SwiftUIPlayer`
        - flowManager: The `FlowManager` to use for fetching flows
        - handleScroll: Whether or not the `ManagedPlayer` should wrap content in a `ScrollView`
        - onComplete: A handler for when the `FlowManager` signals that it has no more flows to fetch
        - onError: A handler for when the `SwiftUIPlayer` encounters an error
        - loading: A closure providing a `View` to display while the `FlowManager` fetches flows
     */
    public init(
        plugins: [NativePlugin],
        flowManager: FlowManager,
        context: SwiftUIPlayer.Context = .sharedManaged,
        handleScroll: Bool = true,
        onComplete: @escaping (CompletedState) -> Void,
        @ViewBuilder fallback: @escaping (ManagedPlayerErrorContext) -> Fallback,
        @ViewBuilder loading: @escaping () -> Loading
    ) {
        self.init(
            plugins: plugins,
            context: context,
            viewModel: ManagedPlayerViewModel(manager: flowManager, onComplete: onComplete),
            handleScroll: handleScroll,
            fallback: fallback,
            loading: loading
        )
    }

    public var body: some View {
        ManagedPlayer14(
            viewModel: viewModel,
            plugins: plugins,
            context: context,
            handleScroll: handleScroll,
            fallback: fallback,
            loading: loading
        ).onReceive(inspection.notice) { self.inspection.visit(self, $0) }
    }
}
/**
 A managed version of the `SwiftUIPlayer` that uses a provided `FlowManager` to orchestrate
 loading Player through multiple flows, and showing a loading view in between flows
 */
internal struct ManagedPlayer14<Loading: View, Fallback: View>: View {
    @StateObject private var viewModel: ManagedPlayerViewModel

    private var plugins: [NativePlugin]
    @ObservedObject private var context: SwiftUIPlayer.Context

    @State private var inViewState = false

    private var loading: () -> Loading
    private var fallback: (ManagedPlayerErrorContext) -> Fallback

    private var handleScroll: Bool

    /**
     Creates a `ManagedPlayer`
     - parameters:
        - viewModel: The `ManagedPlayerViewModel` to use for fetching flows
        - plugins: The plugins to use for the `SwiftUIPlayer`
        - handleScroll: Whether or not the `ManagedPlayer` should wrap content in a `ScrollView`
        - onError: A handler for when the `SwiftUIPlayer` encounters an error
        - loading: A closure providing a `View` to display while the `FlowManager` fetches flows
     */
    public init(
        viewModel: ManagedPlayerViewModel,
        plugins: [NativePlugin],
        context: SwiftUIPlayer.Context = .sharedManaged,
        handleScroll: Bool = true,
        @ViewBuilder fallback: @escaping (ManagedPlayerErrorContext) -> Fallback,
        @ViewBuilder loading: @escaping () -> Loading
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.plugins = plugins
        self._context = ObservedObject(initialValue: context)
        self.loading = loading
        self.fallback = fallback
        self.handleScroll = handleScroll
    }

    public var body: some View {
        bodyContent(viewModel.stateTransition.call() ?? .identity)
            .onDisappear {
                context.clearExceptionHandler()
            }
    }

    private var isViewLoaded: Bool {
        guard case .loaded = viewModel.loadingState else { return false }
        return inViewState
    }

    private func bodyContent(_ transitionInfo: PlayerViewTransition) -> some View {
        VStack {
            Group {
                switch viewModel.loadingState {
                case .idle:
                    Color.clear.onAppear {
                        context.unload()
                        Task { await viewModel.next() }
                    }
                case .retry(let prevResult):
                    Color.clear.onAppear {
                        context.unload()
                        Task { await viewModel.next(prevResult) }
                    }
                case .failed(let error):
                    fallback(ManagedPlayerErrorContext(error: error, retry: viewModel.retry, reset: viewModel.reset)).onAppear { context.unload() }
                case .loading, .loaded:
                    /// to prevent alternative between loaded and loading state when flows reach multiple non VIEW states after another causing flickering of the loading spinner, change the opacity to show either the loading view or the player view
                    ZStack {
                        // use isViewLoaded to determine when the loader is shown instead of checking for .loading case
                        loading().opacity(isViewLoaded ? 0 : 1)
                        
                        if case .loaded(let flow) = viewModel.loadingState {
                            makePlayerView(flow: flow).opacity(isViewLoaded ? 1 : 0)
                        }
                    }
                    .onChange(of: viewModel.loadingState) { newState in
                        if case .loading = newState {
                            // only call unload if were in loading state
                            context.unload()
                        }
                    }
                }
            }
        }
        .animation(transitionInfo.animationCurve, value: viewModel.loadingState)
    }

    func makePlayerView(flow: String) -> some View {
        SwiftUIPlayer(
            flow: flow,
            plugins: plugins + [viewModel] + scrollPlugin + [ToggleInViewPlugin(isViewLoaded: self.$inViewState)],
            result: $viewModel.result,
            context: context,
            unloadOnDisappear: false
        )
    }

    var scrollPlugin: [NativePlugin] {
        guard
            plugins.filter({ $0 as? ScrollPlugin != nil }).count == 0,
            handleScroll
        else { return [] }
        return [ScrollPlugin()]
    }
}

/// A plugin for the passed into the SwiftUIPlayer for determining when a view has been loaded based on the binding passed in
/// updates that binding to false once the view disappears
fileprivate class ToggleInViewPlugin: NativePlugin {

    @Binding public var isViewLoaded: Bool

    public init(isViewLoaded: Binding<Bool>) {
        self._isViewLoaded = isViewLoaded
    }

   public var pluginName: String = "ToggleInViewPlugin"

   public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }

       player.hooks?.flowController.tap { flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.transition.tap { [weak self] _, newState in
                    // set isViewLoaded back to false to show loading spinner when we transition to non view
                    if (newState.value as? NavigationFlowViewState) == nil {
                        DispatchQueue.main.async {
                          self?.$isViewLoaded.wrappedValue = false
                        }

                    }
                }
            }
        }

       // ensures we only set isViewLoaded to true once a view has been loaded
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { [weak self] val in
                    DispatchQueue.main.async {
                        self?.$isViewLoaded.wrappedValue = true
                    }
                }
            }
        })
    }
}

private extension Collection where Element == NativePlugin {
    func apply(_ model: ManagedPlayerViewModel) {
        compactMap { $0 as? ManagedPlayerPlugin }.forEach { $0.apply(model) }
    }
}

public extension SwiftUIPlayer.Context {
    /// Where @StateObject is available it should be used.
    /// Where it is not available this context allows JSContext reuse by a ManagedPlayer.
    static let sharedManaged = SwiftUIPlayer.Context { .sharedManaged }
}

private extension JSContext {
    static var sharedManaged: JSContext! { JSContext(virtualMachine: .playerShared) }
}

private extension JSVirtualMachine {
    static let playerShared: JSVirtualMachine = .init()
}

/// A function for retrying the previous flow load (recalls `next` with the same CompletedState)
public typealias ManagedPlayerRetry = () -> Void

/// A function for resetting the `FlowManager`
public typealias ManagedPlayerReset = () -> Void

/**
 The context for constructing a fallback component when there is an error in the `FlowManager`
 */
public struct ManagedPlayerErrorContext {
    /// The Error that occurred
    public var error: Error
    /// A function for retrying the previous flow load (recalls `next` with the same CompletedState)
    public var retry: ManagedPlayerRetry

    /// A function for resetting the `FlowManager` (calls `next` with `nil` to fetch the first flow again)
    public var reset: ManagedPlayerReset
}

/**
 A helper for ViewInspector
 */
internal final class Inspection<V> where V: View {

    let notice = PassthroughSubject<UInt, Never>()
    var callbacks = [UInt: (V) -> Void]()

    func visit(_ view: V, _ line: UInt) {
        if let callback = callbacks.removeValue(forKey: line) {
            callback(view)
        }
    }
}
