//
//  FlowManager.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/26/21.
//

import Foundation
import Combine

/// A state object to return from a FlowManager to advance
public enum NextState {
    case flow(String)
    case finished
}

/**
 A protocol declaring the required properties for a FlowManager
 that is used with the `ManagedPlayer` to orchestrate advancing between
 multiple flows from some data source
 */
public protocol FlowManager {
    /**
     A function called to fetch the next flow
     `CompletedState` will be `nil` if it is asking for the first state
     - parameters:
        - state: The `CompletedState` from the previous flow if there was one
    */
    func next(_: CompletedState?) async throws -> NextState

    /**
     Called when the `ManagedPlayer` is being removed from the view tree
     if there is a flow in progress, `state` will be non-nil, if `ManagedPlayer` is loading
     a flow, or in an error state, `state` will be nil
     - parameters:
        - state: The InProgressState for the current flow
     */
    func terminate(state: InProgressState?)
}

/**
 Default Implementation for `terminate(player:)`
 */
public extension FlowManager {
    func terminate(state: InProgressState?) {}
}
