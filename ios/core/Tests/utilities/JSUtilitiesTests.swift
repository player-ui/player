//
//  JSUtilitiesTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 4/13/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
import XCTest
@testable import PlayerUI

class JSUtilitiesTests: XCTestCase {
    func testPolyfill() {
        let context = JSContext()!
        JSUtilities.polyfill(context)
        let expection = XCTestExpectation(description: "setTimeout called")

        let function: @convention(block) () -> Void = {
            expection.fulfill()
        }
        context.objectForKeyedSubscript("setTimeout")?.call(withArguments: [JSValue(object: function, in: context) as Any, 1])
        wait(for: [expection], timeout: 2)
    }

    func testPromiseSucceeds() {
        let context = JSContext()!

        let promise = JSUtilities.createPromise(context: context) { (resolve, _) in
            resolve()
        }

        let thenExpect = XCTestExpectation(description: "then called")
        let then: @convention(block) (JSValue) -> Void = { _ in
            thenExpect.fulfill()
        }

        let thenHandler = JSValue(object: then, in: context)
        promise?.invokeMethod("then", withArguments: [thenHandler as Any])

        wait(for: [thenExpect], timeout: 1)
    }

    func testPromiseFails() {
        let context = JSContext()!

        let promise = JSUtilities.createPromise(context: context) { (_, reject) in
            reject()
        }

        let thenExpect = XCTestExpectation(description: "then called")
        let then: @convention(block) (JSValue) -> Void = { _ in
            thenExpect.fulfill()
        }

        let thenHandler = JSValue(object: then, in: context)

        let catchExpect = XCTestExpectation(description: "catch called")
        let catchFn: @convention(block) (JSValue) -> Void = { _ in
            catchExpect.fulfill()
        }

        let catchHandler = JSValue(object: catchFn, in: context)
        promise?.invokeMethod("then", withArguments: [thenHandler as Any])?.invokeMethod("catch", withArguments: [catchHandler as Any])

        wait(for: [catchExpect], timeout: 1)
    }

    func testJsonData() throws {
        let context = JSContext()!

        let obj = context.evaluateScript("({a: 1})")

        let objWithNaN = context.evaluateScript("({a: NaN})")

        let objWithFunction = context.evaluateScript("({a: () => {}})")

        let array = context.evaluateScript("(['a', 'b'])")

        let str = context.evaluateScript("('a')")

        XCTAssertEqual(try obj?.jsonData(), """
        {"a":1}
        """.data(using: .utf8))

        XCTAssertEqual(try objWithNaN?.jsonData(), """
        {"a":null}
        """.data(using: .utf8))

        XCTAssertEqual(try objWithFunction?.jsonData(), """
        {"a":{}}
        """.data(using: .utf8))

        XCTAssertEqual(try array?.jsonData(), """
        ["a","b"]
        """.data(using: .utf8))

        XCTAssertEqual(try str?.jsonData(), "\"a\"".data(using: .utf8))
    }

    func testDecodeLogsTruncatedPreviewForSmallPayload() throws {
        let context = JSContext()!
        let value = context.evaluateScript("({id: 'test', type: 'text'})")!

        let logger = TapableLogger()
        logger.logLevel = .trace

        var loggedMessage: String?
        logger.hooks.trace.tap(name: "test") { messages in
            loggedMessage = messages.compactMap { $0 as? String }.joined()
        }

        let decoder = JSONDecoder()
        decoder.setLogger(logger)

        struct SimpleAsset: Decodable {
            let id: String
            let type: String
        }

        let decoded = try decoder.decode(SimpleAsset.self, from: value)
        XCTAssertEqual(decoded.id, "test")

        let message = try XCTUnwrap(loggedMessage)
        XCTAssertTrue(message.contains("bytes)"), "Log should include byte count")
        XCTAssertFalse(message.hasSuffix("..."), "Small payload should not be truncated")
    }

    func testDecodeLogsTruncatedPreviewForLargePayload() throws {
        let context = JSContext()!
        // Generate a JSON object larger than 500 bytes
        let script = "({id: 'test', type: 'text', value: '\(String(repeating: "x", count: 600))'})"
        let value = context.evaluateScript(script)!

        let logger = TapableLogger()
        logger.logLevel = .trace

        var loggedMessage: String?
        logger.hooks.trace.tap(name: "test") { messages in
            loggedMessage = messages.compactMap { $0 as? String }.joined()
        }

        let decoder = JSONDecoder()
        decoder.setLogger(logger)

        struct SimpleAsset: Decodable {
            let id: String
            let type: String
            let value: String
        }

        let decoded = try decoder.decode(SimpleAsset.self, from: value)
        XCTAssertEqual(decoded.id, "test")

        let message = try XCTUnwrap(loggedMessage)
        XCTAssertTrue(message.contains("bytes)"), "Log should include byte count")
        XCTAssertTrue(message.hasSuffix("..."), "Large payload should be truncated with ellipsis")
    }
}
