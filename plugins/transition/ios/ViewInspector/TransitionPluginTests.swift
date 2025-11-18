//
//  TransitionPluginTests.swift
//  PlayerUI_ExampleUITests
//
//  Created by Harris Borawski on 9/16/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector
import Combine

@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI
@testable import PlayerUITransitionPlugin

class TransitionPluginTests: XCTestCase {
    open override func setUp() {
        XCUIApplication().terminate()
    }

    func testTransitionPluginStateTransitions() {
        let flow = TestFlowManager()
        let model = ManagedPlayerViewModel(manager: flow) { _ in }
        let plugin = TransitionPlugin(stateTransition: .test1, popTransition: .pop)
        plugin.apply(model)
        XCTAssertEqual(model.stateTransition.call(), .test1)
    }

    func testTransitionPluginDefaultTransitions() throws {
        let plugin = TransitionPlugin(pushTransition: .test1, popTransition: .test2)
        let player = SwiftUIPlayer(flow: FlowData.MULTIPAGE, plugins: [ReferenceAssetsPlugin(), plugin])

        ViewHosting.host(view: player)

        func callTransitionAndAssert(expectedTransition: PlayerViewTransition, description: String) {
            let transitionExpectation = XCTestExpectation(description: "Waiting for \(description)")
            var capturedTransition: PlayerViewTransition?

            DispatchQueue.main.async {
                capturedTransition = player.hooks?.transition.call()
                // Delay the assertion to allow for any post-call processing
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    XCTAssertEqual(capturedTransition, expectedTransition, "Transition for \(description) should be \(expectedTransition)")
                    transitionExpectation.fulfill()
                }
            }
            wait(for: [transitionExpectation], timeout: 3.0)
        }


        // Check initial transition
        callTransitionAndAssert(expectedTransition: .identity, description: "initial state")

        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "next")
        } catch {
            XCTFail("Transition with 'next' failed")
        }

        // Check transition after "next"
        callTransitionAndAssert(expectedTransition: .test1, description: "push transition")

        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "prev")
        } catch {
            XCTFail("Transition with 'prev' failed")
        }

        // Check transition after "prev"
        callTransitionAndAssert(expectedTransition: .test2, description: "pop transition")

        ViewHosting.expel()
    }

    struct TestFlowManager: FlowManager {
        func next(_ result: CompletedState?) async throws -> NextState {
            return .flow("")
        }
    }
}

private extension PlayerViewTransition {
    static let test1 = PlayerViewTransition(name: Name(rawValue: "test1"), transition: .opacity, animationCurve: .default)
    static let test2 = PlayerViewTransition(name: Name(rawValue: "test2"), transition: .identity, animationCurve: .default)
}
