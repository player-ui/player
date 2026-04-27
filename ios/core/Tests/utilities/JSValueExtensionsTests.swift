//
//  JSValueExtensionsTests.swift
//  PlayerUI-Unit-Unit
//
//  Created by Zhao Xia Wu on 2024-01-22.
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore
import XCTest

class JSValueExtensionsTests: XCTestCase {
    private let context: JSContext = .init()

    func testTryCatchWrapperReturningError() {
        let functionReturningError = context
            .evaluateScript("""
              (() => {
                 throw new Error("Fail")
              })
            """)

        do {
            _ = try functionReturningError?.tryCatch(args: [] as [String])
        } catch {
            XCTAssertEqual(
                error as? JSValueError,
                JSValueError.thrownFromJS(message: "Error: Fail")
            )
        }
    }

    func testTryCatchWrapperReturningNumber() {
        let functionReturningInt = context
            .evaluateScript("""
             (() => {
                return 1
             })
            """)

        do {
            let result = try functionReturningInt?.tryCatch(args: [] as [String])
            XCTAssertEqual(result?.toInt32(), 1)
        } catch {
            XCTFail("Should have returned Int but failed with \(error)")
        }
    }

    func testTransitionDuringAnActiveTransitionShouldCatchErrorUsingTryCatchWrapper() {
        let player = HeadlessPlayerImpl(plugins: [])

        let expectation = expectation(description: "Wait for on update")

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { _ in
                    guard view.id == "view-2" else {
                        do {
                            try (player.state as? InProgressState)?.controllers?
                                .flow
                                .transition(with: "NEXT")
                        } catch {
                            XCTAssertEqual(
                                error as? JSValueError,
                                JSValueError
                                    .thrownFromJS(
                                        message: "Error: Transitioning while ongoing transition from VIEW_1 is in progress is not supported"
                                    )
                            )
                            expectation.fulfill()
                        }

                        return
                    }
                }
            }
        }

        player.start(flow: FlowData.MULTIPAGE, completion: { _ in })
        wait(for: [expectation], timeout: 1)
    }
}
