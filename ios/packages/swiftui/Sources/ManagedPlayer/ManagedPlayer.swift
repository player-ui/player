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
                case .loading:
                    loading().onAppear { context.unload() }
                case .failed(let error):
                    fallback(ManagedPlayerErrorContext(error: error, retry: viewModel.retry, reset: viewModel.reset)).onAppear { context.unload() }
                case .loaded(let flow):
                    makePlayerView(flow: flow)
                        .transition(transitionInfo.transition)
                }
            }
        }
        .animation(transitionInfo.animationCurve, value: viewModel.loadingState)
    }

    func makePlayerView(flow: String) -> some View {
        SwiftUIPlayer(
            flow: flow,
            plugins: plugins + [viewModel] + scrollPlugin,
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

