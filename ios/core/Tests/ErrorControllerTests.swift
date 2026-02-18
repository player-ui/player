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
        XCTAssertTrue(initialError?.isUndefined ?? false)
        
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
        XCTAssertTrue(currentErrorAfter?.isUndefined ?? false)
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
        XCTAssertTrue(currentErrorAfter?.isUndefined ?? false)
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

