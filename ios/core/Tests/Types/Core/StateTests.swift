//
//  StateTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/23/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
import XCTest

class StateTests: XCTestCase {
    func testCompletedStateCreation() {
        let value = JSValue()
        XCTAssertNil(CompletedState.createInstance(from: value))
    }
}
