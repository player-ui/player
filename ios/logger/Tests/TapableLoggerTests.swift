//
//  TapableLoggerTests.swift
//  PlayerUI_Example
//
//  Created by Harris Borawski on 8/26/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
import SwiftHooks
@testable import PlayerUILogger

class TapableLoggerTests: XCTestCase {
    func testJSConversion() {
        let context = JSContext()!

        let logger = TapableLogger()

        let undef = context.evaluateScript("(undefined)")!

        let string = context.evaluateScript("('a')")!

        let number = context.evaluateScript("(1)")!

        let array = context.evaluateScript("(['a', 'b'])")!

        let object = context.evaluateScript("({a: 1})")!

        XCTAssertNil(logger.convertJSValue(undef))

        XCTAssertEqual(logger.convertJSValue(string), "\"a\"")

        XCTAssertEqual(logger.convertJSValue(number), "1")

        XCTAssertEqual(logger.convertJSValue(array), "[\"a\",\"b\"]")

        XCTAssertEqual(logger.convertJSValue(object), "{\"a\":1}")
    }

    func testMessagePrefixing() {
        let logger = TapableLogger()
        logger.logLevel = .info
        logger.hooks.prefixMessage.tap(name: "test") { (level) -> BailResult<String?> in
            return .bail("[Test][\(level)]: ")
        }

        let logExpect = expectation(description: "Prefixed message logged")
        logger.hooks.info.tap(name: "test") { (message) in
            XCTAssertEqual("[Test][ info]: Message", message)
            logExpect.fulfill()
        }

        logger.i("Message")

        wait(for: [logExpect], timeout: 1)
    }

    enum TestError: Error {
        case errored
    }
    func testLogHooks() {
        let logger = TapableLogger()
        logger.logLevel = .trace

        let traceExpect = expectation(description: "trace message logged")
        let debugExpect = expectation(description: "debug message logged")
        let infoExpect = expectation(description: "info message logged")
        let warningExpect = expectation(description: "warning message logged")
        let errorMsgExpect = expectation(description: "error message logged")
        let errorExpect = expectation(description: "error message logged")
        logger.hooks.trace.tap(name: "test") { _ in traceExpect.fulfill() }
        logger.hooks.debug.tap(name: "test") { _ in debugExpect.fulfill() }
        logger.hooks.info.tap(name: "test") { _ in infoExpect.fulfill() }
        logger.hooks.warn.tap(name: "test") { _ in warningExpect.fulfill() }
        logger.hooks.error.tap(name: "test") { err in
            if let _ = err.1 {
                errorExpect.fulfill()
            } else if let _ = err.0 {
                errorMsgExpect.fulfill()
            }
        }

        logger.t("Message")
        logger.d("Message")
        logger.i("Message")
        logger.w("Message")
        logger.e("Message")
        logger.e(TestError.errored)

        wait(for: [traceExpect, debugExpect, infoExpect, warningExpect, errorExpect, errorMsgExpect], timeout: 1)
    }

    func testLogAutoclosures() {
        let logger = TapableLogger()
        logger.logLevel = .warning
        var messageCalled = false
        var message: String {
            messageCalled = true
            return "message"
        }

        var tapMessage: String?
        logger.tapLogs { message in
            tapMessage = message
        }

        logger.t(message)
        XCTAssertFalse(messageCalled)
        XCTAssertNil(tapMessage)
        logger.w(message)
        XCTAssertTrue(messageCalled)
        XCTAssertTrue(tapMessage?.hasSuffix("\(LogLevel.warning.description)] message") ?? false)
    }

    func testTapAllLogs() {
        let logger = TapableLogger()
        logger.logLevel = .trace
        var messages: [String] = []
        logger.tapLogs { message in
            messages.append(message)
        }

        for level in LogLevel.allCases {
            logger.log(level: level, message: "msg")
        }

        let expected = LogLevel.allCases.map { "\($0)] msg" }
        XCTAssertTrue(zip(messages, expected).map({ $0.0.hasSuffix($0.1) }).allSatisfy({ $0 }))
    }
}
