//
//  DebugValueTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 6/30/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI

class DebugValueTests: XCTestCase {
    func testDebugValue() {
        guard
            let context = JSContext(),
            let val = JSValue(newObjectIn: context)
        else { return XCTFail("could not create JSValue") }
        val.setObject(1, forKeyedSubscript: "key")

        let debug = DebugValue.createInstance(value: val)

        XCTAssertEqual(1, debug.value.objectForKeyedSubscript("key")?.toObject() as? Int)
    }
}
