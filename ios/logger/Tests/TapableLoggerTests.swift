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

        let arrayOfObjectAndStrings = context.evaluateScript("(['message 1', {a: 1}, 'message 2'])")!

        XCTAssertNil(logger.convertJSValue(undef))

        XCTAssertEqual(logger.convertJSValue(string) as? [String], ["a"])

        XCTAssertEqual(logger.convertJSValue(number) as? [Int] , [1])

        XCTAssertEqual(logger.convertJSValue(array) as? [String] , ["a","b"])

        XCTAssertEqual(logger.convertJSValue(object) as? [[String: Int]] , [["a":1]])

        XCTAssertEqual(logger.convertJSValue(arrayOfObjectAndStrings) as? [AnyHashable], ["message 1", ["a":1], "message 2"])
    }

    enum ArrayObjects: Decodable, Equatable {
        case string(String)
        case dictionary([String:Int])

        public init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            do {
                self = .string(try container.decode(String.self))
            } catch {
                self = .dictionary(try container.decode([String:Int].self))
            }
        }
    }


    func testMessage() {
        let logger = TapableLogger()
        logger.logLevel = .info

        let logExpect = expectation(description: "Prefixed message logged")
        logger.hooks.info.tap(name: "test") { (message) in
            XCTAssertEqual("Message", (message as? [String])?.first)
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
}
