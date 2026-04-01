//
//  JSValueExtensionsTests.swift
//  PlayerUI-Unit-Unit
//
//  Created by Zhao Xia Wu on 2024-01-22.
//


import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore

class JSValueExtensionsTests: XCTestCase {
    let context: JSContext = JSContext()
    /// Test case for base JS Errors
    func testTryCatchThrowsSimpleError() {

        let functionReturningError = self.context
            .evaluateScript("""
                             (() => {
                                throw new Error("Fail")
                             })
                           """)

        XCTAssertThrowsError(try functionReturningError?.tryCatch(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            switch jsValueError {
            case .simpleJsError(_, let message):
                XCTAssertEqual(message, "Fail")
            default:
                XCTFail("Unhandled case")
            }
        })
    }
    
    /// Test case for errors thrown with error controller metadata. Check that metadata is preserved
    func testTryCatchThrowsErrorWithMetadata() {

        let functionReturningError = self.context
            .evaluateScript("""
                             (() => {
                                const err = new Error("Fail")
                                err.type = "Error Type"
                                err.severity = "error"
                                err.metadata = {
                                  property: "value"
                                }
                                throw err
                             })
                           """)

        XCTAssertThrowsError(try functionReturningError?.tryCatch(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            switch jsValueError {
            case .errorWithMetadata(_, let message, let type, let severity, let metadata):
                XCTAssertEqual(message, "Fail")
                XCTAssertEqual(type, "Error Type")
                XCTAssertEqual(severity, ErrorSeverity.error)
                XCTAssertNotNil(metadata)
                XCTAssertEqual(metadata!["property"] as? String, "value")
            default:
                XCTFail("Unhandled case")
            }
        })
    }
    
    /// Test case for non-Errror throws in JS. Need to ensure we still throw something
    func testTryCatchThrowsUnknownError() {

        let functionReturningError = self.context
            .evaluateScript("""
                             (() => {
                                throw false
                             })
                           """)

        XCTAssertThrowsError(try functionReturningError?.tryCatch(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            switch jsValueError {
            case .unknownError(let jsError):
                XCTAssertTrue(jsError.isBoolean)
                XCTAssertFalse(jsError.toBool())
            default:
                XCTFail("Unhandled case")
            }
        })
    }

    func testTryCatchWrapperReturningNumber() {
        let functionReturningInt = self.context
            .evaluateScript("""
                            (() => {
                               return 1
                            })
                           """)

        do {
            let result = try functionReturningInt?.tryCatch(args: [] as [String])
            XCTAssertEqual(result?.toInt32(), 1)
        } catch let error {
            XCTFail("Should have returned Int but failed with \(error)")
        }
    }

    func testTransitionDuringAnActiveTransitionShouldCatchErrorUsingTryCatchWrapper() {
        let player = HeadlessPlayerImpl(plugins: [])

        let expectation = expectation(description: "Wait for on update")

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { value in
                    guard view.id == "view-2" else {
                        do {
                            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
                        } catch let error {
                            guard let jsValueError = error as? JSValueError else {
                                XCTFail("Should throw a JSValueError")
                                return
                            }
                            
                            switch jsValueError {
                            case .simpleJsError(_, let message):
                                XCTAssertEqual(message, "Transitioning while ongoing transition from VIEW_1 is in progress is not supported")
                            default:
                                XCTFail("Should throw a JSValueError.simpleJsError")
                            }
                            
                            expectation.fulfill()
                        }

                        return
                    }
                }
            }
        }

        player.start(flow: FlowData.MULTIPAGE, completion: {_ in})
        wait(for: [expectation], timeout: 1)
    }
}