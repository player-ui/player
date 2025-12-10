//
//  CommonExpressionsPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 1/28/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUICommonExpressionsPlugin

class CommonExpressionsPluginTests: XCTestCase {
    func testPluginConstructs() {
        let context = JSContext()

        let plugin = CommonExpressionsPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }
}
