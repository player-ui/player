//
//  ConstantFlowManager.swift
//  PlayerUI
//
//  Created by Harris Borawski on 4/5/21.
//

import Foundation
import Combine

/**
 A `FlowManager` implementation that advances through an array of flows on each
 successful flow completion with a variable delay for flow loading
 */
public class ConstantFlowManager: FlowManager {
    private var elements: [String]
    private var index = 0
    private var delay: TimeInterval

    private var previous: CompletedState?
    /**
     Creates a `ConstantFlowManager`
     - parameters:
        - elements: The full flow strings to use as flows in order
        - delay: The time to delay when loading the next flow in the array, to show the loading screen
     */
    public init(_ elements: [String] = [], delay: TimeInterval = 1) {
        self.elements = elements
        self.delay = delay
    }

    /**
     Uses the result of the current flow to fetch the next flow, updating the publisher
     - parameters:
        - result: The result of the current flow
     */
    public func next(_ result: CompletedState?) async throws -> NextState {
        if result == nil {
            index = 0
        } else if result?.flow.id != previous?.flow.id {
            self.index += 1
        }

        defer { self.previous = result }
        try await Task.sleep(nanoseconds: 1_000_000_000 * UInt64(delay))
        if self.index < self.elements.count {
            return .flow(self.elements[self.index])
        } else {
            return .finished
        }
    }
}
