//
//  PartialMatchFingerprintPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 5/20/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
import XCTest
@testable import PlayerUI

class PartialMatchFingerprintPluginTests: XCTestCase {
    func testMapping() {
        let context = JSContext()

        let plugin = PartialMatchFingerprintPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)

        plugin.setMapping(assetId: "a", index: 1)
        XCTAssertEqual(1, plugin.get(assetId: "a"))
    }
}
