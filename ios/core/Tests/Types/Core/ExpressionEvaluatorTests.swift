//
//  ExpressionEvaluatorTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/16/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore
import XCTest

class ExpressionEvaluatorTests: XCTestCase {
    func testExpressionEvaluator() {
        let player = HeadlessPlayerImpl(plugins: [])

        player.start(flow: FlowData.COUNTER, completion: { _ in })
        XCTAssertNotNil(player.state as? InProgressState)
        guard let state = player.state as? InProgressState
        else { return XCTFail("state was not InProgressState") }
        XCTAssertNotNil(state.controllers?.expression.evaluate("{{count}} = 6"))
        XCTAssertNotNil(state.controllers?.expression.evaluate(["{{count}} = 6", "{{count}}"]))
    }
}
