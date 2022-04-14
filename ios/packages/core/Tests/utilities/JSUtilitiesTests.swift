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

    func testJsonStringPretty() {
        let context = JSContext()!

//        let undef = context.evaluateScript("(undefined)")

        let obj = context.evaluateScript("({a: 1})")

        let array = context.evaluateScript("(['a', 'b'])")

//        let str = context.evaluateScript("('a')")

//        XCTAssertEqual(undef?.jsonDisplayString, "undefined")

        XCTAssertEqual(obj?.jsonDisplayString, """
        {
          "a" : 1
        }
        """)

        XCTAssertEqual(array?.jsonDisplayString, """
        [
          "a",
          "b"
        ]
        """)

//        XCTAssertEqual(str?.jsonDisplayString, "a")
    }
}
