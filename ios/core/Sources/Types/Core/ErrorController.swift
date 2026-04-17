//
//  ErrorController.swift
//  PlayerUI
//
//  Created by Player Team
//

import Foundation
import JavaScriptCore

/**
 Severity levels for errors
 */
public enum ErrorSeverity: String {
    /// Cannot continue, flow must end
    case fatal
    /// Standard error, may allow recovery
    case error
    /// Non-blocking, logged for telemetry
    case warning
}

/**
 Known error types for Player
 */
public struct ErrorTypes {
    public static let expression = "expression"
    public static let binding = "binding"
    public static let view = "view"
    public static let asset = "asset"
    public static let navigation = "navigation"
    public static let validation = "validation"
    public static let data = "data"
    public static let schema = "schema"
    public static let network = "network"
    public static let plugin = "plugin"
    public static let render = "render"
}

/**
 A wrapper around the JS ErrorController in the core player
 */
public class ErrorController: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = ErrorController
    
    /**
     Creates an instance from a JSValue, used for generic construction
     - parameters:
        - value: The JSValue to construct from
     */
    public static func createInstance(value: JSValue) -> ErrorController { ErrorController(value) }
    
    /// The JSValue that backs this wrapper
    private let value: JSValue
    
    /// The hooks that can be tapped into
    public let hooks: ErrorControllerHooks
    
    /**
     Construct an ErrorController from a JSValue
     - parameters:
        - value: The JSValue that is the ErrorController
     */
    public init(_ value: JSValue) {
        self.value = value
        hooks = ErrorControllerHooks(
            onError: HookWithResult<JSValueError, Bool>(baseValue: value, name: "onError")
        )
    }
    
    /**
     Capture an error with metadata
     - parameters:
        - error: The native Error object
        - errorType: Error category (use ErrorTypes constants)
        - severity: Impact level
        - metadata: Additional metadata dictionary
     - returns: The captured error as a JSValue
     */
    @discardableResult
    public func captureError(
        error: Error
    ) -> Bool {
        var args: [Any] = []
        
        if let err = error as? JSConvertibleError & Error {
            args.append(value.context.error(for: err) as Any)
        } else {
            args.append(value.context.error(for: PlayerError.unknownResponse(error)) as Any)
        }
        
        let result = value.invokeMethod("captureError", withArguments: args)
        if let boolResult = result, boolResult.isBoolean {
            return boolResult.toBool()
        }
        
        return false
    }
    
    /**
     Get the most recent error
     - returns: The current error as a JSValue if one exists
     */
    public func getCurrentError() -> JSValue? {
        return value.invokeMethod("getCurrentError", withArguments: [])
    }
    
    /**
     Get the complete error history
     - returns: JSValue representing the array of errors
     */
    public func getErrors() -> JSValue? {
        return value.invokeMethod("getErrors", withArguments: [])
    }
    
    /**
     Clear all errors (history + current + data model)
     */
    public func clearErrors() {
        value.invokeMethod("clearErrors", withArguments: [])
    }
    
    /**
     Clear only current error and remove from data model, preserve history
     */
    public func clearCurrentError() {
        value.invokeMethod("clearCurrentError", withArguments: [])
    }
}
