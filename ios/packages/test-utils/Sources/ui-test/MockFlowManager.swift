//
//  MockFlowManager.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2023-10-26.
//

import Foundation

public class MockFlowManager: FlowManager {
    let flowSequence: [String]
    private var flowIndex = 0

    public init(flowSequence: [String]) {
        self.flowSequence = flowSequence
    }

    public func next(_ result: CompletedState?) async throws -> NextState {
        guard result != nil else {
            flowIndex = 0
            return .flow(flowSequence.first ?? "")
        }

        if flowIndex >= flowSequence.count - 1 {
            return .finished
        }

        flowIndex += 1

        return .flow(flowSequence[flowIndex])
    }

    /// Called when ManagedPlayer exits before completing a flow
    /// - Parameter state: The state of player at termination
    public func terminate(state: InProgressState?) {
        guard state != nil else { return }
        flowIndex = 0
    }
}
