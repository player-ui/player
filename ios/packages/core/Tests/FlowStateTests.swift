//
//  FlowStateTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/23/23.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI

class FlowStateTests: XCTestCase {
    func testViewFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.COUNTER) { _ in}

        guard let inProgress = player.state as? InProgressState else { return XCTFail("State not in progress") }

        XCTAssertNotNil(inProgress.controllers?.flow.current?.currentState?.value as? NavigationFlowViewState)
        let view = inProgress.controllers?.flow.current?.currentState?.value as? NavigationFlowViewState

        XCTAssertEqual(view?.attributes?["test"], "value")
    }

    func testExternalFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.externalFlow) { _ in}

        guard let inProgress = player.state as? InProgressState else { return XCTFail("State not in progress") }

        XCTAssertNotNil(inProgress.controllers?.flow.current?.currentState?.value as? NavigationFlowExternalState)
    }

    func testActionFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])
        let hitActionNode = expectation(description: "ACTION state hit")
        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.transition.tap { oldState, _ in
                    guard
                        let old = oldState?.value as? NavigationFlowActionState,
                        case .single(let exp) = old.exp
                    else { return }
                    XCTAssertEqual(exp, "{{foo}}")
                    hitActionNode.fulfill()
                }
            }
        })
        player.start(flow: FlowData.actionFlow) { _ in}

        wait(for: [hitActionNode], timeout: 1)

    }

    func testActionMultiExpFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])
        let hitActionNode = expectation(description: "ACTION state hit")
        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.transition.tap { oldState, _ in
                    guard
                        let old = oldState?.value as? NavigationFlowActionState,
                        case .multi(let exp) = old.exp
                    else { return }
                    XCTAssertEqual(exp, ["{{foo}}", "{{bar}}"])
                    hitActionNode.fulfill()
                }
            }
        })
        player.start(flow: FlowData.actionMultiExpFlow) { _ in}

        wait(for: [hitActionNode], timeout: 1)

    }

    func testEndFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])
        let endStateHit = expectation(description: "Flow Ended")
        player.start(flow: FlowData.actionFlow) { result in
            switch result {
            case .success(let completed):
                XCTAssertEqual(completed.endState?.outcome, "done")
                XCTAssertEqual(completed.endState?.param?["someKey"] as? String, "someValue")
                let extraKey: String? = completed.endState?.extraKey
                XCTAssertEqual(extraKey, "extraValue")
                let extraObject: [String: Any]? = completed.endState?.extraObject
                XCTAssertEqual(extraObject?["someInt"] as? Int, 1)
                endStateHit.fulfill()
            default: XCTFail("Flow should have succeeded")
            }
        }

        wait(for: [endStateHit], timeout: 1)

    }
}
