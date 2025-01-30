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
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore

class FlowStateTests: XCTestCase {
    func testViewFlowState() {
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.COUNTER) { _ in}

        guard let inProgress = player.state as? InProgressState else { return XCTFail("State not in progress") }

        XCTAssertNotNil(inProgress.controllers?.flow.current?.currentState?.value as? NavigationFlowViewState)
        let view = inProgress.controllers?.flow.current?.currentState?.value as? NavigationFlowViewState

        XCTAssertEqual(view?.attributes?["test"] as? String, "value")
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

        player.hooks?.onStart.tap { flow in
            XCTAssertEqual(flow.id, "counter-flow")
        }

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

    func testFlowControllerTransitionHooks() {
        let player = HeadlessPlayerImpl(plugins: [PrintLoggerPlugin(level: .info)])

        var pendingTransition: (currentState: NamedState?, transitionValue: String?)?
        var completedTransition: (from: NamedState?, to: NamedState?)?

        let hitForceBeforeTransition = expectation(description: "BeforeTransition Hit with *")
        let hitForceTransition = expectation(description: "transition Hit with *")

        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in

                flow.hooks.beforeTransition.tap { state, transitionValue in
                    pendingTransition = (currentState: flow.currentState, transitionValue: transitionValue)

                    XCTAssertEqual(flow.currentState?.name, "VIEW_1")
                    hitForceBeforeTransition.fulfill()

                    return state
                }

                flow.hooks.transition.tap { from, to in
                    if from?.name == "VIEW_1" && to.name == "END_Done" {
                        XCTAssertEqual(from?.name, "VIEW_1")
                        XCTAssertEqual(to.name, "END_Done")

                        hitForceTransition .fulfill()
                    }

                    completedTransition = (from: from, to: to)
                }
            }
        })

        player.start(flow: FlowData.flowControllerFlow) { _ in}

        XCTAssertNil(pendingTransition)
        XCTAssertNil(completedTransition?.from)
        XCTAssertEqual(completedTransition?.to?.name, "VIEW_1")

        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "*")
        } catch let error {
            XCTFail("Transition with * failed with \(error)")
        }

        let pendingFrom = pendingTransition?.currentState?.value as? NavigationFlowTransitionableState

        XCTAssertNotNil(pendingFrom)
        XCTAssertEqual((pendingFrom as? NavigationFlowViewState)?.ref, "view-1")
        XCTAssertEqual(pendingTransition?.transitionValue, "*")
        XCTAssertEqual(completedTransition?.from?.name, "VIEW_1")
        XCTAssertEqual(completedTransition?.to?.name, "END_Done")

        wait(for: [hitForceTransition, hitForceBeforeTransition], timeout: 15)
    }
}
