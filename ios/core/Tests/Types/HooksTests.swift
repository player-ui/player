//
//  HooksTests.swift
//  PlayerUI_Tests
//
//  Created by Player Team
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore

class HooksTests: XCTestCase {
    var player: HeadlessPlayerImpl!
    
    override func setUp() {
        super.setUp()
        player = HeadlessPlayerImpl(plugins: [])
    }
    
    override func tearDown() {
        player = nil
        super.tearDown()
    }
    
    // MARK: - Hook2 Return Value Behavior
    
    func testHook2ReturnValueIsIgnoredForNonBailHooks() {
        // Track whether each handler is called (proving JS ignores the first handler's return value)
        var firstHandlerCallCount = 0
        var secondHandlerCallCount = 0
        
        let bothHandlersCalled = expectation(description: "Both handlers called at least once")
        
        player.hooks?.flowController.tap { flowController in
            flowController.hooks.flow.tap { flow in
                // First handler - returns true (attempting to bail)
                flow.hooks.transition.tap { oldState, newState -> Bool in
                    firstHandlerCallCount += 1
                    
                    // Fulfill once both handlers have been called at least once
                    if secondHandlerCallCount > 0 {
                        bothHandlersCalled.fulfill()
                    }
                    
                    return true  // Returning true, but JS IGNORES it (not a bail hook!)
                }
                
                // Second handler - SHOULD be called despite first returning true
                flow.hooks.transition.tap { oldState, newState -> Bool in
                    secondHandlerCallCount += 1
                    
                    // Fulfill once both handlers have been called at least once
                    if firstHandlerCallCount > 0 {
                        bothHandlersCalled.fulfill()
                    }
                    
                    return false
                }
            }
        }
        
        // Allow expectation to be fulfilled multiple times (transitions happen during start AND manual transition)
        bothHandlersCalled.assertForOverFulfill = false
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        // Trigger a transition
        if let inProgressState = player.state as? InProgressState {
            do {
                try inProgressState.controllers?.flow.transition(with: "NEXT")
            } catch {
                XCTFail("Transition failed: \(error)")
            }
        }
        
        // Verify: BOTH handlers were called (proves JS ignored the true return value)
        wait(for: [bothHandlersCalled], timeout: 2)
        
        // Verify both handlers were actually called
        XCTAssertGreaterThan(firstHandlerCallCount, 0, "First handler should be called at least once")
        XCTAssertGreaterThan(secondHandlerCallCount, 0, "Second handler should be called despite first returning true")
        
        // Verify: Despite returning true, the transition completed normally
        if let inProgressState = player.state as? InProgressState {
            XCTAssertNotNil(inProgressState.controllers?.flow.current?.currentState,
                           "Flow should have transitioned successfully - return value was ignored by JS")
        }
    }
    
    // MARK: - BailHook Return Value Behavior
    
    func testBailHookReturnsTrueStopsSubsequentHandlers() {
        let firstHandlerCalled = expectation(description: "First handler called")
        let secondHandlerCalled = expectation(description: "Second handler called")
        secondHandlerCalled.isInverted = true // Should NOT be called
        
        player.hooks?.errorController.tap { errorController in
            // First handler - returns true to bail
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                XCTAssertEqual(errorInfo.errorType, ErrorTypes.network)
                firstHandlerCalled.fulfill()
                return true  // BAIL - should prevent second handler from being called
            }
            
            // Second handler - should NOT be called due to bail
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                secondHandlerCalled.fulfill()
                return nil
            }
            
            // Capture error to trigger the hooks
            errorController.captureError(
                error: NSError(domain: "test", code: 500, userInfo: [NSLocalizedDescriptionKey: "Server error"]),
                errorType: ErrorTypes.network,
                severity: .fatal
            )
            
            // Verify error was captured
            let currentError = errorController.getCurrentError()
            XCTAssertNotNil(currentError)
            
            // Check that errorState was NOT set in data model (bail prevented it)
            if let inProgressState = self.player.state as? InProgressState,
               let dataController = inProgressState.controllers?.data {
                let errorState = dataController.get(binding: "errorState")
                // errorState should be nil because bail prevented it from being set
                XCTAssertTrue(errorState == nil || (errorState as? NSNull) != nil)
            }
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [firstHandlerCalled, secondHandlerCalled], timeout: 2)
    }
    
    func testBailHookReturnsNilContinuesToNextHandler() {
        let firstHandlerCalled = expectation(description: "First handler called")
        let secondHandlerCalled = expectation(description: "Second handler called")
        
        player.hooks?.errorController.tap { errorController in
            // First handler - returns nil to continue
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                XCTAssertEqual(errorInfo.errorType, ErrorTypes.data)
                firstHandlerCalled.fulfill()
                return nil  // Continue to next handler
            }
            
            // Second handler - should be called
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                XCTAssertEqual(errorInfo.errorType, ErrorTypes.data)
                secondHandlerCalled.fulfill()
                return nil
            }
            
            // Capture error to trigger the hooks
            errorController.captureError(
                error: NSError(domain: "test", code: 400, userInfo: [NSLocalizedDescriptionKey: "Data error"]),
                errorType: ErrorTypes.data,
                severity: .error
            )
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [firstHandlerCalled, secondHandlerCalled], timeout: 2)
    }
}
