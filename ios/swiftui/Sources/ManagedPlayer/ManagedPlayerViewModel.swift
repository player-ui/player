//
//  ManagedPlayerViewModel.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/26/21.
//

import Combine
import Foundation
import PlayerUI
import SwiftHooks

/// A plugin used by the ManagedPlayer.
///
/// When a ManagedPlayer is instantiated it will call `apply(_:)` on all managed player plugins it
/// is
/// provided.
public protocol ManagedPlayerPlugin {
    /// Called by the ManagedPlayer upon instantiation.
    func apply(_ model: ManagedPlayerViewModel)
}

/// A ViewModel for the `ManagedPlayer` that orchestrates the use of the `FlowManager`
/// passed to it
public class ManagedPlayerViewModel: ObservableObject, NativePlugin {
    public var pluginName: String = "ManagedPlayerViewModel"

    /// The current flow to run in the `SwiftUIPlayer`
    @Published public var flow: String?

    /// The result of the last flow
    @Published public var result: Result<CompletedState, PlayerError>?

    /// Provide Transition Animation information for load state transitions in managed flows
    public let stateTransition: SyncBailHook<Void, PlayerViewTransition> = .init()

    /// A function to get the delay for view transitions
    public var getDelay: (() -> Double?)?

    /// The Loading State for `ManagedPlayer`
    @Published private(set) var loadingState: LoadingState = .idle

    /// The current state of the current player
    var currentState: InProgressState?

    /// The last completed state
    private var prevResult: CompletedState?

    private var onComplete: (CompletedState) -> Void

    private var onStartedFlow: (String) -> Void

    /// The `FlowManager` that is used for this instance
    private var manager: FlowManager

    private var bag: Set<AnyCancellable> = []

    /// Creates a new `ManagedPlayerViewModel`
    /// - parameters:
    ///   - manager: The `FlowManager` to use for fetching flows
    ///   - onComplete: A handler for when the `FlowManager` signals that it has no more flows to
    /// fetch
    ///   - onStartedFlow: A handler for when a flow is started, passed the flow `String` that was
    /// used to start it
    ///   - onError: A handler for when the `SwiftUIPlayer` encounters an error
    public init(
        manager: FlowManager,
        onComplete: @escaping (CompletedState) -> Void,
        onStartedFlow: @escaping (String) -> Void = { _ in }
    ) {
        self.manager = manager
        self.onComplete = onComplete
        self.onStartedFlow = onStartedFlow

        $result.sink { [weak self] result in
            guard let result else { return }
            self?.handleResult(result)
        }
        .store(in: &bag)
    }

    deinit {
        manager.terminate(state: currentState)
        bag.forEach { $0.cancel() }
    }

    public func apply<P: HeadlessPlayer>(player: P) {
        player.hooks?.state.tap { [weak self] state in
            guard let inProgress = state as? InProgressState else {
                self?.currentState = nil
                return
            }
            self?.currentState = inProgress
        }
    }

    /// Resets and starts the multi-flow experience from the beginning
    public func reset() {
        prevResult = nil
        loadingState = .idle
    }

    /// Refetches the last loaded flow
    public func retry() {
        if let prev = prevResult {
            loadingState = .retry(prev)
        } else {
            loadingState = .idle
        }
    }

    func handleResult(_ result: Result<CompletedState, PlayerError>) {
        switch result {
        case let .success(completed):
            prevResult = completed
            Task { [weak self] in await self?.next(completed) }
        case let .failure(error):
            loadingState = .failed(error)
        }
    }

    func next(_ state: CompletedState? = nil) async {
        Task { @MainActor in
            self.loadingState = .loading
            self.flow = nil

            do {
                let nextFlow = try await self.manager.next(result: state)
                self.handleNextFlow(nextFlow)
            } catch {
                self.loadingState = .failed(error)
            }
        }
    }

    func handleNextFlow(_ nextFlow: String?) {
        if let flow = nextFlow {
            if !flow.isEmpty {
                self.flow = flow
                loadingState = .loaded(flow)
                // Notify that a flow has started, passing back the in-memory flow that was used to
                // start Player (avoids deserializing the flow back across the JS bridge)
                onStartedFlow(flow)
            } else {
                loadingState = .failed(ManagedPlayerError.emptyFlow)
            }
        } else {
            guard let finalState = prevResult else { return }
            onComplete(finalState)
        }
    }

    /// The state of loading flows
    public enum LoadingState: Equatable {
        /// Player has been constructed but not yet fetching
        case idle
        /// An error occurred and a retry can be attempted
        case retry(CompletedState)
        /// Loading the next flow
        case loading
        /// The flow failed with an error
        case failed(Error)
        /// Flow was successfully loaded
        case loaded(String)

        var isLoaded: Bool {
            guard case .loaded = self else { return false }
            return true
        }

        public static func == (lhs: Self, rhs: Self) -> Bool {
            switch (lhs, rhs) {
            case (.idle, .idle): return true
            case (.loading, .loading): return true
            case let (.loaded(lll), .loaded(rrr)) where lll == rrr: return true
            case let (.retry(lll), .retry(rrr)) where lll === rrr: return true
            default: return false
            }
        }
    }
}
