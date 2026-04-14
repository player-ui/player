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

private struct ErrorWithAnyMetadata: Error, ErrorWithMetadata, JSConvertibleError {
    public var message: String
    public var type: String
    public var severity: ErrorSeverity?
    public var metadata: [String : Any]?
    
    public let hasMetadata: Bool = true
    public var jsDescription: String { get { message } }
}

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
                XCTAssertEqual(errorInfo.type, ErrorTypes.validation)
                XCTAssertEqual(errorInfo.severity, .error)
                XCTAssertFalse(errorInfo.message.isEmpty)
                onErrorCalled.fulfill()
                return nil
            }
            
            // Capture a test error
            errorController.captureError(
                error: ErrorWithAnyMetadata(message: "Error", type: ErrorTypes.validation, severity: .error, metadata: ["testKey": "testValue"])
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
        
        guard let errorController = state.controllers?.error else {
            XCTFail("Error controller not found")
            return
        }
        
        let testError = ErrorWithAnyMetadata(message: "Error", type: ErrorTypes.network, severity: .error, metadata: ["url": "https://example.com", "statusCode": 404])
        
        let result = errorController.captureError(
            error: testError
        )
        
        XCTAssertFalse(result)
        
        let capturedErrorValue = errorController.getCurrentError()
        
        // Convert JSValue to PlayerErrorInfo
        guard let jsValue = capturedErrorValue else {
            return XCTFail("No error captured")
        }
        
        let capturedError = JSValueError.createInstance(value: jsValue)
        XCTAssertEqual(capturedError.message, "Error")
        XCTAssertEqual(capturedError.type, ErrorTypes.network)
        XCTAssertEqual(capturedError.severity, .error)
        XCTAssertNotNil(capturedError.metadata)
    }
    
    func testCaptureErrorWithMinimalParameters() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        let testError = ErrorWithAnyMetadata(message: "Error", type: ErrorTypes.plugin)
        
        let result = errorController.captureError(
            error: testError
        )
        
        XCTAssertFalse(result)
        let capturedErrorValue = errorController.getCurrentError()
        
        // Convert JSValue to PlayerErrorInfo
        guard let jsValue = capturedErrorValue else {
            return XCTFail("No error captured")
        }
        
        let capturedError = JSValueError.createInstance(value: jsValue)
        XCTAssertEqual(capturedError.message, "Error")
        XCTAssertEqual(capturedError.type, ErrorTypes.plugin)
        XCTAssertNil(capturedError.severity)
        XCTAssertNil(capturedError.metadata)
    }
    
    func testCaptureMultipleErrorsAndCurrentErrorUpdates() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        // Capture first error
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "First Error", type: ErrorTypes.validation, severity: .warning)
        )
        
        // Verify current error is the first one
        guard let firstErrorValue = errorController.getCurrentError(), !firstErrorValue.isUndefined else {
            return XCTFail("First error not found")
        }
        
        XCTAssertEqual(JSValueError.createInstance(value: firstErrorValue).message, "First Error")
        
        // Capture second error
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Second Error", type: ErrorTypes.binding, severity: .error)
        )
        
        // Current error should be updated to the second one
        guard let secondErrorValue = errorController.getCurrentError(), !secondErrorValue.isUndefined else {
            return XCTFail("Second error not found")
        }
        
        XCTAssertEqual(JSValueError.createInstance(value: secondErrorValue).message, "Second Error")
        
        // Capture third error
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Third Error", type: ErrorTypes.view, severity: .fatal)
        )
        
        // Current error should be updated to the third one
        guard let thirdErrorValue = errorController.getCurrentError(), !thirdErrorValue.isUndefined else {
            return XCTFail("Third error not found")
        }
        
        XCTAssertEqual(JSValueError.createInstance(value: thirdErrorValue).message, "Third Error")
        
        // Get all errors and verify history
        guard let errorsValue = errorController.getErrors(),
              let errorsArray = errorsValue.toArray() else {
            return XCTFail("Could not get errors array")
        }
        
        // Verify we have 3 errors
        XCTAssertEqual(errorsArray.count, 3, "Expected 3 errors in history")
        
        // Verify the errors by accessing them as JSValues directly from the errorsValue
        let firstError = JSValueError.createInstance(value: errorsValue.atIndex(0))
        let secondError = JSValueError.createInstance(value: errorsValue.atIndex(1))
        let thirdError = JSValueError.createInstance(value: errorsValue.atIndex(2))
        
        XCTAssertEqual(firstError.message, "First Error")
        XCTAssertEqual(secondError.message, "Second Error")
        XCTAssertEqual(thirdError.message, "Third Error")
    }
    
    // MARK: - Get Current Error Tests
    
    func testGetCurrentError() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        // Initially no current error
        let initialError = errorController.getCurrentError()
        XCTAssertTrue(initialError?.isUndefined ?? false)
        
        // Capture an error
        let testError = ErrorWithAnyMetadata(message: "Error", type: ErrorTypes.data, severity: .error)
        
        errorController.captureError(
            error: testError
        )
        
        // Now should have a current error
        guard let currentErrorValue = errorController.getCurrentError(),
              !currentErrorValue.isUndefined else {
            return XCTFail("Current error should exist")
        }
        
        let currentError = JSValueError.createInstance(value: currentErrorValue)
        XCTAssertEqual(currentError.message, "Error")
        XCTAssertEqual(currentError.type, ErrorTypes.data)
    }
    
    // MARK: - Clear Errors Tests
    
    func testClearAllErrors() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        // Capture multiple errors
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Error 1", type: ErrorTypes.validation)
        )
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Error 2", type: ErrorTypes.binding)
        )
        
        let errorsBeforeCount = errorController.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsBeforeCount, 2)
        
        let currentErrorBefore = errorController.getCurrentError()
        XCTAssertFalse(currentErrorBefore?.isUndefined ?? true)
        
        // Clear all errors
        errorController.clearErrors()
        
        let errorsAfterCount = errorController.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsAfterCount, 0)
        
        let currentErrorAfter = errorController.getCurrentError()
        XCTAssertTrue(currentErrorAfter?.isUndefined ?? false)
    }
    
    func testClearCurrentError() {
        player.start(flow: FlowData.COUNTER) { _ in }
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        // Capture multiple errors
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Error 1", type: ErrorTypes.validation)
        )
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Error 2", type: ErrorTypes.binding)
        )
        
        let errorsBeforeCount = errorController.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsBeforeCount, 2)
        
        let currentErrorBefore = errorController.getCurrentError()
        XCTAssertFalse(currentErrorBefore?.isUndefined ?? true)
        
        // Clear only current error
        errorController.clearCurrentError()
        
        // History should be preserved
        let errorsAfterCount = errorController.getErrors()?.toArray()?.count ?? 0
        XCTAssertEqual(errorsAfterCount, 2)
        
        // Current error should be cleared
        let currentErrorAfter = errorController.getCurrentError()
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
        
        guard let state = player.state as? InProgressState, let errorController = state.controllers?.error else {
            return XCTFail("Player not in progress")
        }
        
        let metadata: [String: Any] = [
            "binding": "data.user.name",
            "attemptedValue": "invalid",
            "validationRule": "minLength",
            "component": "TextInput",
            "timestamp": Date().timeIntervalSince1970
        ]
        
        errorController.captureError(
            error: ErrorWithAnyMetadata(message: "Error 1", type: ErrorTypes.validation, severity: .error, metadata: metadata)
        )
        
        let capturedErrorValue = errorController.getCurrentError()
        
        guard let jsValue = capturedErrorValue else {
            return XCTFail("Error should be captured")
        }
        
        let capturedError = JSValueError.createInstance(value: jsValue)
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

