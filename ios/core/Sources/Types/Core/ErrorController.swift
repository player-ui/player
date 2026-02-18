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
}

/**
 Represents a Player error with metadata
 */
public class PlayerErrorInfo: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = PlayerErrorInfo
    
    /// The JSValue that backs this wrapper
    private let value: JSValue
    
    /// The error message
    public var message: String {
        value.objectForKeyedSubscript("error")?.objectForKeyedSubscript("message")?.toString() ?? ""
    }
    
    /// The error name
    public var name: String {
        value.objectForKeyedSubscript("error")?.objectForKeyedSubscript("name")?.toString() ?? ""
    }
    
    /// Error category
    public var errorType: String {
        value.objectForKeyedSubscript("errorType")?.toString() ?? ""
    }
    
    /// Impact level
    public var severity: ErrorSeverity? {
        guard let severityString = value.objectForKeyedSubscript("severity")?.toString() else {
            return nil
        }
        return ErrorSeverity(rawValue: severityString)
    }
    
    /// Additional metadata
    public var metadata: [String: Any]? {
        guard let metadataValue = value.objectForKeyedSubscript("metadata"),
              !metadataValue.isUndefined,
              !metadataValue.isNull else {
            return nil
        }
        return metadataValue.toObject() as? [String: Any]
    }
    
    /**
     Creates an instance from a JSValue, used for generic construction
     - parameters:
        - value: The JSValue to construct from
     */
    public static func createInstance(value: JSValue) -> PlayerErrorInfo {
        return PlayerErrorInfo(value)
    }
    
    /**
     Construct a PlayerErrorInfo from a JSValue
     - parameters:
        - value: The JSValue that is the error object
     */
    public init(_ value: JSValue) {
        self.value = value
    }
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
            onError: BailHook<PlayerErrorInfo>(baseValue: value, name: "onError")
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
        error: Error,
        errorType: String,
        severity: ErrorSeverity? = nil,
        metadata: [String: Any]? = nil
    ) -> JSValue? {
        var args: [Any] = [
            [
                "message": error.localizedDescription,
                "name": String(describing: type(of: error))
            ] as [String: Any],
            errorType
        ]
        
        if let severity = severity {
            args.append(severity.rawValue)
        } else {
            args.append(JSValue(undefinedIn: value.context) as Any)
        }
        
        if let metadata = metadata {
            args.append(metadata)
        }
        
        return value.invokeMethod("captureError", withArguments: args)
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
