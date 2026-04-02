//
//  ExpressionPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 6/10/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIExpressionPlugin

class ExpressionPluginTests: XCTestCase {
    var context: JSContext!

    override func setUp() {
        super.setUp()
        context = JSContext()
        context.loadCore()
    }
    func testExpressionPluginConstructsWithoutExpressions() {
        let plugin = ExpressionPlugin()
        plugin.context = context
        XCTAssertNotNil(plugin.pluginRef)
    }

    func testExpressionPluginConstructsWithExpressions() {
        let expectation = XCTestExpectation(description: "custom expression called")
        let plugin = ExpressionPlugin(expressions: ["test": {_ in expectation.fulfill() }])
        plugin.context = context
        XCTAssertNotNil(plugin.pluginRef)
        plugin.pluginRef?.objectForKeyedSubscript("expressions")?.invokeMethod("get", withArguments: ["test"])?.call(withArguments: [])
        wait(for: [expectation], timeout: 1)
    }

    func testExpressionPluginConstructsWithExpressionsAndParameter() {
        let expectation = XCTestExpectation(description: "custom expression called")
        let plugin = ExpressionPlugin(expressions: ["test": { args in
            if let arg = args.first as? String, arg == "example" {
                expectation.fulfill()
            }
            return nil
        }])
        plugin.context = context
        XCTAssertNotNil(plugin.pluginRef)
        plugin.pluginRef?.objectForKeyedSubscript("expressions")?.invokeMethod("get", withArguments: ["test"])?.call(withArguments: ["context", "example"])
        wait(for: [expectation], timeout: 1)
    }

    func testExpressionPluginConstructsWithExpressionsAndParameters() {
        let expectation = XCTestExpectation(description: "custom expression called")
        let plugin = ExpressionPlugin(expressions: ["test": { args in
            if let arg = args as? [String], arg == ["example", "with", "parameters"] {
                expectation.fulfill()
            }
            return nil
        }])
        plugin.context = context
        XCTAssertNotNil(plugin.pluginRef)
        plugin.pluginRef?
            .objectForKeyedSubscript("expressions")?
            .invokeMethod("get", withArguments: ["test"])?
            .call(withArguments: ["context", "example", "with", "parameters"])
        wait(for: [expectation], timeout: 1)
    }
}
