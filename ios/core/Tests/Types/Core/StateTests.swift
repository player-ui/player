//
//  StateTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/23/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI

class StateTests: XCTestCase {
    let context = JSContext()!

    func testParsesCompletedStateFromJS() {
        // Define a JS value completed state. This may not be what we actually
        // get from the core, but it's sufficient for testing
        let value = context.evaluateScript("""
        ({
            status: "completed",
            flow: { id: "flow" },
            endState: { outcome: "done" },
            data: { count: 1 },
            controllers: {
                data: {
                    get: function() { return 1 }
                }
            }
        })
        """)

        let completedState = CompletedState.createInstance(from: value)
        XCTAssertEqual(completedState?.flow.id, "flow")
        XCTAssertEqual(completedState?.endState?.outcome, "done")
        let countFromData = completedState?.data["count"] as? Int
        XCTAssertEqual(countFromData, 1)
        let dataController = completedState?.controllers.data
        let countFromDataController = dataController?.get(binding: .init(stringLiteral: "count")) as? Int
        XCTAssertEqual(countFromDataController, 1)
    }
}
