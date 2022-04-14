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

    func testCompletedStateCreation() {
        let value = JSValue()
        XCTAssertNil(CompletedState.createInstance(from: value))
    }
}
