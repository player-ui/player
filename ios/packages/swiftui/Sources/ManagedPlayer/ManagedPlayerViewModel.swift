//
//  ManagedPlayerViewModel.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/26/21.
//

import Foundation
import Combine
import SwiftHooks

/// A plugin used by the ManagedPlayer.
///
/// When a ManagedPlayer is instantiated it will call `apply(_:)` on all managed player plugins it is
/// provided.
protocol ManagedPlayerPlugin {
    /// Called by the ManagedPlayer upon instantiation.
    func apply(_ model: ManagedPlayerViewModel)
}

/**
 A ViewModel for the `ManagedPlayer` that orchestrates the use of the `FlowManager`
 passed to it
 */
public class ManagedPlayerViewModel: ObservableObject, NativePlugin {
    public var pluginName: String = "ManagedPlayerViewModel"

    /**
     The state of loading flows
     */
    public enum LoadingState: Equatable {
        public static func == (lhs: Self, rhs: Self) -> Bool {
            switch (lhs, rhs) {
            case (.idle, .idle):                                        return true
            case (.loading, .loading):                                  return true
            case (.loaded(let lll), .loaded(let rrr)) where lll == rrr: return true
            case (.retry(let lll), .retry(let rrr)) where lll === rrr:  return true
            default:                                                    return false
            }
        }

        var isLoaded: Bool {
            guard case .loaded = self else { return false }
            return true
        }

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
    }

    /// The Loading State for `ManagedPlayer`
    @Published private(set) var loadingState: LoadingState = .idle

    /// The current flow to run in the `SwiftUIPlayer`
    @Published public var flow: String?

    /// The result of the last flow
    @Published public var result: Result<CompletedState, PlayerError>?

    /// Provide Transition Animation information for load state transitions in managed flows
    public let stateTransition = SyncBailHook<Void, PlayerViewTransition>()

    /// A function to get the delay for view transitions
    public var getDelay: (() -> Double?)?

    /// Logger instance from current player
    private var logger: JSLogger?

    /// The current state of the current player
    internal var currentState: InProgressState?

    /// The last completed state
    private var prevResult: CompletedState?

    private var prevState: NextState?

    private var onComplete: (CompletedState) -> Void

    /// The `FlowManager` that is used for this instance
    private var manager: FlowManager

    private var bag = Set<AnyCancellable>()

    /**
     Creates a new `ManagedPlayerViewModel`
     - parameters:
        - manager: The `FlowManager` to use for fetching flows
        - onComplete: A handler for when the `FlowManager` signals that it has no more flows to fetch
        - onError: A handler for when the `SwiftUIPlayer` encounters an error
     */
    public init(
        manager: FlowManager,
        onComplete: @escaping (CompletedState) -> Void
    ) {
        self.manager = manager
        self.onComplete = onComplete

        $result.sink { [weak self] result in
            guard let result = result else { return }
            self?.handleResult(result)
        }.store(in: &bag)
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        player.hooks?.state.tap({ (state) in
            guard let inProgress = state as? InProgressState else {
                self.currentState = nil
                return
            }
            self.currentState = inProgress
        })
    }

    func handleResult(_ result: Result<CompletedState, PlayerError>) {
        switch result {
        case .success(let completed):
            self.prevResult = completed
            Task { await self.next(completed) }
        case .failure(let error):
            self.loadingState = .failed(error)
        }
    }

    func next(_ state: CompletedState? = nil) async {
        DispatchQueue.main.async { [weak self] in
            self?.loadingState = .loading
            self?.flow = nil
        }

        do {
            let nextState = try await self.manager.next(state)
            DispatchQueue.main.async { [weak self] in
                self?.handleNextState(nextState)
            }
        } catch {
            self.loadingState = .failed(error)
        }
    }

    func handleNextState(_ state: NextState) {
        prevState = state
        switch state {
        case .flow(let flow):
            if !flow.isEmpty {
                self.flow = flow
                loadingState = .loaded(flow)
            } else {
                loadingState = .failed(ManagedPlayerError.emptyFlow)
            }
        case .finished:
            guard let finalState = prevResult else { return }
            onComplete(finalState)
        }
    }

    /**
     Resets and starts the multi-flow experience from the beginning
     */
    public func reset() {
        prevResult = nil
        loadingState = .idle
    }

    /**
     Refetches the last loaded flow
     */
    public func retry() {
        if let prev = prevResult {
            loadingState = .retry(prev)
        } else {
            loadingState = .idle
        }
    }

    deinit {
        manager.terminate(state: currentState)
        bag.forEach { $0.cancel() }
    }
}
