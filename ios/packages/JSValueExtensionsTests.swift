//
//  JSValueExtensionsTests.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-17.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI

class JSValueExtensionsTests: XCTestCase {
    let context: JSContext = JSContext()
    func testTryCatchWrapperReturningError() {
        
        let functionReturningError = self.context
            .evaluateScript("""
                             (() => {
                                throw new Error("Fail")
                             })
                           """)

        do {
            let _ = try functionReturningError?.tryCatch(args: [] as [String])
        } catch let error {
            XCTAssertEqual(error as? JSValueError, JSValueError.thrownFromJS(message: "Error: Fail"))
        }
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

        var caughtError = false

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { value in
                    guard view.id == "view-2" else {
                        do {
                            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
                        } catch let error {
                            caughtError = true
                            XCTAssertEqual(error as? JSValueError, JSValueError.thrownFromJS(message: "Error: Transitioning while ongoing transition from VIEW_1 is in progress is not supported"))
                        }

                        if !caughtError {
                            XCTFail("Expected error, but no error was caught")
                        }

                        return
                    }
                }
            }
        }

        player.start(flow: FlowData.MULTIPAGE, completion: {_ in})
    }
}
