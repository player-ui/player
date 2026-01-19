//
//  ErrorControllerTests.swift
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

class ErrorControllerTests: XCTestCase {
    var player: HeadlessPlayerImpl!
    
    override func setUp() {
        super.setUp()
        player = HeadlessPlayerImpl(plugins: [])
    }
    
    override func tearDown() {
        player = nil
        super.tearDown()
    }
    
    // MARK: - Hook Tests
    
    func testErrorControllerHookIsCalled() {
        let errorHookCalled = expectation(description: "Error hook called")
        
        player.hooks?.errorController.tap { errorController in
            XCTAssertNotNil(errorController)
            XCTAssertNotNil(errorController.hooks.onError)
            errorHookCalled.fulfill()
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [errorHookCalled], timeout: 2)
    }
    
    func testOnErrorHookIsTapped() {
        let onErrorCalled = expectation(description: "onError hook called")
        
        player.hooks?.errorController.tap { errorController in
            errorController.hooks.onError.tap { errorInfo in
                XCTAssertNotNil(errorInfo)
                XCTAssertEqual(errorInfo.errorType, ErrorTypes.validation)
                XCTAssertEqual(errorInfo.severity, .error)
                XCTAssertFalse(errorInfo.message.isEmpty)
                onErrorCalled.fulfill()
                return nil
            }
            
            // Capture a test error
            errorController.captureError(
                error: NSError(domain: "test", code: 123, userInfo: [NSLocalizedDescriptionKey: "Test error"]),
                errorType: ErrorTypes.validation,
                severity: .error,
                metadata: ["testKey": "testValue"]
            )
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [onErrorCalled], timeout: 2)
    }
    
    // MARK: - Hook Return Value Behavior Tests
    
    func testBailHookReturnValueCausesBail() {
        let firstHandlerCalled = expectation(description: "First handler called")
        let secondHandlerCalled = expectation(description: "Second handler called")
        secondHandlerCalled.isInverted = true // Should NOT be called
        
        player.hooks?.errorController.tap { errorController in
            // First handler - returns true to bail
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                XCTAssertEqual(errorInfo.errorType, ErrorTypes.network)
                firstHandlerCalled.fulfill()
                return true  // BAIL - should prevent second handler and error state
            }
            
            // Second handler - should NOT be called due to bail
            errorController.hooks.onError.tap { errorInfo -> Bool? in
                secondHandlerCalled.fulfill()
                return nil
            }
            
            // Capture error
            errorController.captureError(
                error: NSError(domain: "test", code: 500, userInfo: [NSLocalizedDescriptionKey: "Server error"]),
                errorType: ErrorTypes.network,
                severity: .fatal
            )
            
            // Verify error was captured but error state was NOT set due to bail
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
    
    func testBailHookNilReturnContinuesToNextHandler() {
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
            
            // Capture error
            errorController.captureError(
                error: NSError(domain: "test", code: 400, userInfo: [NSLocalizedDescriptionKey: "Data error"]),
                errorType: ErrorTypes.data,
                severity: .error
            )
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [firstHandlerCalled, secondHandlerCalled], timeout: 2)
    }
    
    func testHook2ReturnValueIsIgnoredByJavaScript() {
        let firstHandlerCalled = expectation(description: "First handler called")
        let secondHandlerCalled = expectation(description: "Second handler called")
        // Note: NOT inverted - we EXPECT second handler to be called (proving JS ignores return)
        
        player.hooks?.flowController.tap { flowController in
            flowController.hooks.flow.tap { flow in
                // First handler - returns true (attempting to bail)
                flow.hooks.transition.tap { oldState, newState -> Bool in
                    firstHandlerCalled.fulfill()
                    return true  // Returning true, but JS IGNORES it (not a bail hook!)
                }
                
                // Second handler - SHOULD be called despite first returning true
                flow.hooks.transition.tap { oldState, newState -> Bool in
                    secondHandlerCalled.fulfill()
                    return false
                }
            }
        }
        
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
        wait(for: [firstHandlerCalled, secondHandlerCalled], timeout: 2)
        
        // Verify: Despite returning true, the transition completed normally
        if let inProgressState = player.state as? InProgressState {
            XCTAssertNotNil(inProgressState.controllers?.flow.current?.currentState,
                           "Flow should have transitioned successfully - return value was ignored by JS")
        }
    }
    
    // MARK: - Error Capture Tests
    
    func testCaptureErrorWithAllParameters() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        XCTAssertNotNil(errorController)
        
        let testError = NSError(
            domain: "com.test",
            code: 404,
            userInfo: [NSLocalizedDescriptionKey: "Not found"]
        )
        
        let capturedErrorValue = errorController?.captureError(
            error: testError,
            errorType: ErrorTypes.network,
            severity: .error,
            metadata: ["url": "https://example.com", "statusCode": 404]
        )
        
        XCTAssertNotNil(capturedErrorValue)
        
        // Convert JSValue to PlayerErrorInfo
        if let jsValue = capturedErrorValue {
            let capturedError = PlayerErrorInfo(jsValue)
            XCTAssertEqual(capturedError.message, "Not found")
            XCTAssertEqual(capturedError.errorType, ErrorTypes.network)
            XCTAssertEqual(capturedError.severity, .error)
            XCTAssertNotNil(capturedError.metadata)
        }
    }
    
    func testCaptureErrorWithMinimalParameters() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        XCTAssertNotNil(errorController)
        
        let testError = NSError(
            domain: "com.test",
            code: 500,
            userInfo: [NSLocalizedDescriptionKey: "Internal error"]
        )
        
        let capturedErrorValue = errorController?.captureError(
            error: testError,
            errorType: ErrorTypes.plugin
        )
        
        XCTAssertNotNil(capturedErrorValue)
        
        // Convert JSValue to PlayerErrorInfo
        if let jsValue = capturedErrorValue {
            let capturedError = PlayerErrorInfo(jsValue)
            XCTAssertEqual(capturedError.message, "Internal error")
            XCTAssertEqual(capturedError.errorType, ErrorTypes.plugin)
            XCTAssertNil(capturedError.severity)
            XCTAssertNil(capturedError.metadata)
        }
    }
    
    func testCaptureMultipleErrorsAndCurrentErrorUpdates() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        XCTAssertNotNil(errorController)
        
        // Capture first error
        errorController?.captureError(
            error: NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "First error"]),
            errorType: ErrorTypes.validation,
            severity: .warning
        )
        
        // Verify current error is the first one
        if let firstErrorValue = errorController?.getCurrentError(), !firstErrorValue.isUndefined {
            XCTAssertEqual(PlayerErrorInfo(firstErrorValue).message, "First error")
        }
        
        // Capture second error
        errorController?.captureError(
            error: NSError(domain: "test", code: 2, userInfo: [NSLocalizedDescriptionKey: "Second error"]),
            errorType: ErrorTypes.binding,
            severity: .error
        )
        
        // Current error should be updated to the second one
        if let secondErrorValue = errorController?.getCurrentError(), !secondErrorValue.isUndefined {
            XCTAssertEqual(PlayerErrorInfo(secondErrorValue).message, "Second error")
        }
        
        // Capture third error
        errorController?.captureError(
            error: NSError(domain: "test", code: 3, userInfo: [NSLocalizedDescriptionKey: "Third error"]),
            errorType: ErrorTypes.view,
            severity: .fatal
        )
        
        // Current error should be updated to the third one
        if let thirdErrorValue = errorController?.getCurrentError(), !thirdErrorValue.isUndefined {
            XCTAssertEqual(PlayerErrorInfo(thirdErrorValue).message, "Third error")
        }
        
        // Get all errors and verify history
        guard let errorsValue = errorController?.getErrors(),
              let errorsArray = errorsValue.toArray() else {
            return XCTFail("Could not get errors array")
        }
        
        // Verify we have 3 errors
        XCTAssertEqual(errorsArray.count, 3, "Expected 3 errors in history")
        
        // Verify the errors by accessing them as JSValues directly from the errorsValue
        let firstError = PlayerErrorInfo(errorsValue.atIndex(0))
        let secondError = PlayerErrorInfo(errorsValue.atIndex(1))
        let thirdError = PlayerErrorInfo(errorsValue.atIndex(2))
        
        XCTAssertEqual(firstError.message, "First error")
        XCTAssertEqual(secondError.message, "Second error")
        XCTAssertEqual(thirdError.message, "Third error")
    }
    
    // MARK: - Get Current Error Tests
    
    func testGetCurrentError() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        XCTAssertNotNil(errorController)
        
        // Initially no current error
        let initialError = errorController?.getCurrentError()
        XCTAssertTrue(initialError?.isUndefined ?? true)
        
        // Capture an error
        let testError = NSError(
            domain: "test",
            code: 100,
            userInfo: [NSLocalizedDescriptionKey: "Current error"]
        )
        
        errorController?.captureError(
            error: testError,
            errorType: ErrorTypes.data,
            severity: .error
        )
        
        // Now should have a current error
        guard let currentErrorValue = errorController?.getCurrentError(),
              !currentErrorValue.isUndefined else {
            return XCTFail("Current error should exist")
        }
        
        let currentError = PlayerErrorInfo(currentErrorValue)
        XCTAssertEqual(currentError.message, "Current error")
        XCTAssertEqual(currentError.errorType, ErrorTypes.data)
    }
    
    // MARK: - Clear Errors Tests
    
    func testClearAllErrors() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        
        // Capture multiple errors
        errorController?.captureError(
            error: NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Error 1"]),
            errorType: ErrorTypes.validation
        )
        errorController?.captureError(
            error: NSError(domain: "test", code: 2, userInfo: [NSLocalizedDescriptionKey: "Error 2"]),
            errorType: ErrorTypes.binding
        )
        
        let errorsBeforeCount = errorController?.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsBeforeCount, 2)
        
        let currentErrorBefore = errorController?.getCurrentError()
        XCTAssertFalse(currentErrorBefore?.isUndefined ?? true)
        
        // Clear all errors
        errorController?.clearErrors()
        
        let errorsAfterCount = errorController?.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsAfterCount, 0)
        
        let currentErrorAfter = errorController?.getCurrentError()
        XCTAssertTrue(currentErrorAfter?.isUndefined ?? true)
    }
    
    func testClearCurrentError() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        
        // Capture multiple errors
        errorController?.captureError(
            error: NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Error 1"]),
            errorType: ErrorTypes.validation
        )
        errorController?.captureError(
            error: NSError(domain: "test", code: 2, userInfo: [NSLocalizedDescriptionKey: "Error 2"]),
            errorType: ErrorTypes.binding
        )
        
        let errorsBeforeCount = errorController?.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsBeforeCount, 2)
        
        let currentErrorBefore = errorController?.getCurrentError()
        XCTAssertFalse(currentErrorBefore?.isUndefined ?? true)
        
        // Clear only current error
        errorController?.clearCurrentError()
        
        // History should be preserved
        let errorsAfterCount = errorController?.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsAfterCount, 2)
        
        // Current error should be cleared
        let currentErrorAfter = errorController?.getCurrentError()
        XCTAssertTrue(currentErrorAfter?.isUndefined ?? true)
    }

    // MARK: - PlayerControllers Integration Test
    
    func testPlayerControllersIncludesErrorController() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let controllers = state.controllers
        XCTAssertNotNil(controllers)
        XCTAssertNotNil(controllers?.data)
        XCTAssertNotNil(controllers?.flow)
        XCTAssertNotNil(controllers?.view)
        XCTAssertNotNil(controllers?.expression)
        XCTAssertNotNil(controllers?.error)
    }
    
    // MARK: - Error Metadata Tests
    
    func testErrorMetadataCapture() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState else {
            return XCTFail("Player not in progress")
        }
        
        let errorController = state.controllers?.error
        
        let metadata: [String: Any] = [
            "binding": "data.user.name",
            "attemptedValue": "invalid",
            "validationRule": "minLength",
            "component": "TextInput",
            "timestamp": Date().timeIntervalSince1970
        ]
        
        let capturedErrorValue = errorController?.captureError(
            error: NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Validation failed"]),
            errorType: ErrorTypes.validation,
            severity: .error,
            metadata: metadata
        )
        
        guard let jsValue = capturedErrorValue else {
            return XCTFail("Error should be captured")
        }
        
        let capturedError = PlayerErrorInfo(jsValue)
        XCTAssertNotNil(capturedError.metadata)
        XCTAssertEqual(capturedError.metadata?["binding"] as? String, "data.user.name")
        XCTAssertEqual(capturedError.metadata?["attemptedValue"] as? String, "invalid")
        XCTAssertEqual(capturedError.metadata?["validationRule"] as? String, "minLength")
        XCTAssertEqual(capturedError.metadata?["component"] as? String, "TextInput")
    }
    
    // MARK: - Error Controller Accessibility from Controllers
    
    func testErrorControllerAccessibleViaControllers() {
        let errorControllerAccessed = expectation(description: "Error controller accessed")
        
        player.hooks?.state.tap { state in
            guard let inProgress = state as? InProgressState else { return }
            
            if let errorController = inProgress.controllers?.error {
                XCTAssertNotNil(errorController)
                errorControllerAccessed.fulfill()
            }
        }
        
        player.start(flow: FlowData.COUNTER) { _ in }
        
        wait(for: [errorControllerAccessed], timeout: 2)
    }
}

