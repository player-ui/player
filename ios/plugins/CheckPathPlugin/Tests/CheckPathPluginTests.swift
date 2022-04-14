//
//  CheckPathPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 7/17/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore

@testable import PlayerUI

class CheckPathPluginTests: XCTestCase {
    func testCheckPathPluginConstructs() {
        let context = JSContext()!

        let plugin = CheckPathPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }

    func testGetParentContext() {
        let plugin = CheckPathPlugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: FlowData.COUNTER) { _ in}

        let parentAsset = plugin.getParentContext(id: "action-label", query: "action")
        XCTAssertNotNil(parentAsset)
    }

    func testGetParentProp() {
        let plugin = CheckPathPlugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: FlowData.COUNTER) { _ in}

        let parentProp = plugin.getParentProp(id: "action-label")
        XCTAssertNotNil(parentProp)
        XCTAssert(parentProp == "label")
    }

    func testParentContext() {
        let plugin = CheckPathPlugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: FlowData.COUNTER) { _ in}

        XCTAssertTrue(plugin.hasParentContext(id: "action-label", query: "action"))
    }
}
