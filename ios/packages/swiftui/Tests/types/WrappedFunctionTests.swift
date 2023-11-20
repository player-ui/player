//
//  WrappedFunctionTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore

@testable import PlayerUI
class WrappedFunctionTests: XCTestCase {
    let context: JSContext = JSContext()

    private enum PromiseValues: Decodable, Equatable {
        case listOfString([String])
        case listOfCustomStruct([CustomStruct])

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            do {
                self = .listOfString(try container.decode([String].self))
            } catch {
                self = .listOfCustomStruct(try container.decode([CustomStruct].self))
            }
        }
    }

    private struct CustomStruct: Decodable, Equatable, Encodable {
        var someString: String
    }

    func testWrappedFunction() {
        let called = expectation(description: "Function Called")
        let callback: @convention(block) () -> Void = { called.fulfill() }

        let function = JSValue(object: callback, in: context)
        let wrapper = WrappedFunction<Void>(rawValue: function)

        wrapper.callAsFunction()

        wait(for: [called], timeout: 1)
    }

    func testWrappedFunctionWithCustomType() {
        let called = expectation(description: "Function Called")
        let callback: @convention(block) (JSValue) -> JSValue = { _ in
            called.fulfill()
            return self.context.evaluateScript("({someString: 'test'})")
        }

        let function = JSValue(object: callback, in: context)
        let wrapper = WrappedFunction<Void>(rawValue: function)

        do {
            let customStruct = try wrapper.callAsFunction(customType: CustomStruct.self)
            XCTAssertEqual(customStruct, CustomStruct(someString: "test"))
        } catch {
            XCTFail("could not call wrapped function with custom type")
        }

        wait(for: [called], timeout: 1)
    }

    func testWrappedFunctionAsyncReturnsInt() async {
        JSUtilities.polyfill(self.context)

        let function = self.context
            .evaluateScript("""
                              (() => {
                                return new Promise((resolve) => {
                                  setTimeout(
                                    () => { resolve(1) },
                                    1000
                                  )
                                })
                              })
                           """)

        let wrapper = WrappedFunction<Int>(rawValue: function)

        do {
            let result = try await wrapper.callAsFunctionAsync(args: "")
            XCTAssertEqual(result, 1)
        } catch {
            XCTFail("could not call async wrapped function")
        }
    }

    func testWrappedFunctionAsyncReturnsStrings() async {
        JSUtilities.polyfill(self.context)

        let function = self.context
            .evaluateScript("""
                              (() => {
                                return new Promise((resolve) => {
                                  setTimeout(
                                    () => { resolve(["firstString", "secondString"]) },
                                    1000
                                  )
                                })
                              })
                           """)

        let wrapper = WrappedFunction<PromiseValues>(rawValue: function)

        do {
            let result = try await wrapper.callAsFunctionAsync(args: "")
            XCTAssertEqual(result, .listOfString(["firstString", "secondString"]))
        } catch {
            XCTFail("could not call async wrapped function")
        }
    }

    func testWrappedFunctionAsyncReturnsCustomStructs() async {
        JSUtilities.polyfill(self.context)

        let function = self.context
            .evaluateScript("""
                              (() => {
                                return new Promise((resolve) => {
                                  setTimeout(
                                    () => { resolve([{someString: 'test1'}, {someString: 'test2'}]) },
                                    1000
                                  )
                                })
                              })
                           """)

        let wrapper = WrappedFunction<PromiseValues>(rawValue: function)

        do {
            let result = try await wrapper.callAsFunctionAsync(args: "")
            XCTAssertEqual(result, .listOfCustomStruct([CustomStruct(someString: "test1"), CustomStruct(someString: "test2")]))
        } catch {
            XCTFail("could not call async wrapped function")
        }
    }

    func testWrappedFunctionAsyncThrowsError() async {
        JSUtilities.polyfill(self.context)

        let function = self.context
            .evaluateScript("""
                              ( () => Promise.reject(new Error("promise rejected")) )
                           """)

        let wrapper = WrappedFunction<Int>(rawValue: function)

        do {
            _ = try await wrapper.callAsFunctionAsync(args: "")
        } catch {
            XCTAssertEqual(
                WrappedFunction<Int>.Error.promiseFailed(
                    error: """
                                (extension in PlayerUI):PlayerUI.WrappedFunction<Swift.Int>.Error.promiseFailed(error: \"Error: promise rejected\")
                                """),
                WrappedFunction<Int>.Error.promiseFailed(error: error.playerDescription))
        }
    }

    func testWrappedFunctionThrowsError() {
        let called = expectation(description: "Function Called")
        let callback: @convention(block) (JSValue) -> JSValue = { _ in
            called.fulfill()
            return self.context.evaluateScript("({someStringWrong: 'test'})")
        }

        let function = JSValue(object: callback, in: context)
        let wrapper = WrappedFunction<Void>(rawValue: function)

        XCTAssertThrowsError(try wrapper.callAsFunction(customType: CustomStruct.self))

        wait(for: [called], timeout: 1)
    }

    func testModelReference() throws {
        let context = JSContext()
        guard let val = JSValue(object: "Hello World", in: context!) else {
            return XCTFail("could not create JSValue")
        }
        let wrapper = try JSONDecoder().decode(ModelReference.self, from: val)

        XCTAssertEqual("Hello World", wrapper.stringValue)
    }
}
