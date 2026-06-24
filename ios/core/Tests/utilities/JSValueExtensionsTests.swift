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

        XCTAssertThrowsError(try functionReturningError?.callWithErrorHandling(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            XCTAssertFalse(jsValueError.isErrorWithMetadata)
            XCTAssertEqual(jsValueError.message, "Fail")
        })
    }
    
    /// Test case for errors thrown with error controller metadata. Check that metadata is preserved
    func testTryCatchThrowsErrorWithMetadata() {

        let functionReturningError = self.context
            .evaluateScript("""
                             (() => {
                                const error = new Error("Fail")
                                error.type = "Error Type"
                                error.severity = "error"
                                error.metadata = {
                                  property: "value"
                                }
                                throw error
                             })
                           """)

        XCTAssertThrowsError(try functionReturningError?.callWithErrorHandling(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            XCTAssertEqual(jsValueError.message, "Fail")
            XCTAssertEqual(jsValueError.type, .unknown("Error Type"))
            XCTAssertEqual(jsValueError.severity, ErrorSeverity.error)
            XCTAssertNotNil(jsValueError.metadata)
            XCTAssertEqual(jsValueError.metadata?["property"] as? String, "value")
            XCTAssertTrue(jsValueError.isErrorWithMetadata)
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

        XCTAssertThrowsError(try functionReturningError?.callWithErrorHandling(args: [] as [String]), "", { error in
            guard let jsValueError = error as? JSValueError else {
                XCTFail("Should throw a JSValueError")
                return
            }
            
            XCTAssertTrue(jsValueError.originalJSError.isBoolean)
            XCTAssertFalse(jsValueError.originalJSError.toBool())
            XCTAssertEqual(jsValueError.message, "Unknown JS Error")
            XCTAssertFalse(jsValueError.isErrorWithMetadata)
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
            let result = try functionReturningInt?.callWithErrorHandling(args: [] as [String])
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
                            
                            XCTAssertEqual(jsValueError.message, "Transitioning while ongoing transition from VIEW_1 is in progress is not supported")
                            XCTAssertFalse(jsValueError.isErrorWithMetadata)
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
