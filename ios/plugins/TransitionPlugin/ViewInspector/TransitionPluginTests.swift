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

class TransitionPluginTests: ViewInspectorTestCase {
    func testTransitionPluginLegacyStateTransitions() {
        let flow = TestFlowManager()
        let model = ManagedPlayerViewModel(manager: flow) { _ in }
        let plugin = TransitionPlugin(initialLoadTransition: .test1, betweenViewTransition: .test2)
        plugin.apply(model)
        XCTAssertEqual(model.stateTransition.call(), .test1)
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

        let playerTransition1 = player.hooks?.transition.call()
        XCTAssertEqual(playerTransition1, .identity)
        (player.state as? InProgressState)?.controllers?.flow.transition(with: "next")

        let playerTransitions3 = player.hooks?.transition.call()
        XCTAssertEqual(playerTransitions3, .test1)
        (player.state as? InProgressState)?.controllers?.flow.transition(with: "prev")

        let playerTransitions4 = player.hooks?.transition.call()
        XCTAssertEqual(playerTransitions4, .test2)

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
