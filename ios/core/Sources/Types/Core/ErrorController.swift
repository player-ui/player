//
//  ErrorController.swift
//  PlayerUI
//
//  Created by Player Team
//

import Foundation
import JavaScriptCore

/// Severity levels for errors
public enum ErrorSeverity: String {
    /// Cannot continue, flow must end
    case fatal
    /// Standard error, may allow recovery
    case error
    /// Non-blocking, logged for telemetry
    case warning
}

/// Known error types for Player
public enum ErrorTypes: Equatable {
    case expression
    case binding
    case view
    case asset
    case navigation
    case validation
    case data
    case schema
    case network
    case plugin
    case render
    /// An error type not recognized by this version of the SDK.
    case unknown(String)

    public init(_ rawValue: String) {
        switch rawValue {
        case "expression": self = .expression
        case "binding": self = .binding
        case "view": self = .view
        case "asset": self = .asset
        case "navigation": self = .navigation
        case "validation": self = .validation
        case "data": self = .data
        case "schema": self = .schema
        case "network": self = .network
        case "plugin": self = .plugin
        case "render": self = .render
        default: self = .unknown(rawValue)
        }
    }

    public var rawValue: String {
        switch self {
        case .expression: return "expression"
        case .binding: return "binding"
        case .view: return "view"
        case .asset: return "asset"
        case .navigation: return "navigation"
        case .validation: return "validation"
        case .data: return "data"
        case .schema: return "schema"
        case .network: return "network"
        case .plugin: return "plugin"
        case .render: return "render"
        case .unknown(let value): return value
        }
    }
}

/// A wrapper around the JS ErrorController in the core player
public class ErrorController: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = ErrorController

    /// Creates an instance from a JSValue, used for generic construction
    /// - Parameters:
    ///   - value: The JSValue to construct from
    public static func createInstance(value: JSValue) -> ErrorController { ErrorController(value) }

    /// The JSValue that backs this wrapper
    private let value: JSValue

    /// The hooks that can be tapped into
    public let hooks: ErrorControllerHooks

    /// Construct an ErrorController from a JSValue
    /// - Parameters:
    ///   - value: The JSValue that is the ErrorController
    public init(_ value: JSValue) {
        self.value = value
        hooks = ErrorControllerHooks(
            onError: HookWithResult<JSValueError, Bool>(baseValue: value, name: "onError")
        )
    }

    /// Capture an error
    /// - Parameters:
    ///   - error: The native Error object
    /// - Returns: Whether the error was successfully captured
    @discardableResult
    public func captureError(
        error: Error
    ) -> Bool {
        let convertibleError = (error as? JSConvertibleError & Error) ?? PlayerError.unknownResponse(error)
        let args = [value.context.error(for: convertibleError) as Any]

        guard let result = value.invokeMethod("captureError", withArguments: args), result.isBoolean else {
            return false
        }
        return result.toBool()
    }

    /// Get the most recent error
    /// - Returns: The current error as a JSValue if one exists
    public func getCurrentError() -> JSValue? {
        return value.invokeMethod("getCurrentError", withArguments: [])
    }

    /// Get the complete error history
    /// - Returns: JSValue representing the array of errors
    public func getErrors() -> JSValue? {
        return value.invokeMethod("getErrors", withArguments: [])
    }

    /// Clear all errors (history + current + data model)
    public func clearErrors() {
        value.invokeMethod("clearErrors", withArguments: [])
    }

    /// Clear only current error and remove from data model, preserve history
    public func clearCurrentError() {
        value.invokeMethod("clearCurrentError", withArguments: [])
    }
}
