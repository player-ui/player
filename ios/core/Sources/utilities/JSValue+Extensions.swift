//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {
    
    internal enum TryCatchResultKeys {
        static let success = "success"
        static let result = "result"
    }


    /// Calls the JS function with error handling. Throws a `JSValueError` if the JS function throws.
    /// - Parameter args: List of arguments taken by the function
    @discardableResult
    public func callWithErrorHandling(args: Any...) throws -> JSValue? {
        var wrapper: JSValue? {
            self.context.evaluateScript(
            """
               (fn, args) => {
                   try {
                       return {
                           \(TryCatchResultKeys.result): fn(...args),
                           \(TryCatchResultKeys.success): true
                       }
                   } catch(error) {
                       return {
                           \(TryCatchResultKeys.result): error,
                           \(TryCatchResultKeys.success): false
                       }
                   }
               }
            """)
        }

        let result = wrapper?.call(withArguments: [self, args])
        guard
            let success = result?.objectForKeyedSubscript(TryCatchResultKeys.success)?.toBool(),
            let resultValue = result?.objectForKeyedSubscript(TryCatchResultKeys.result)
        else {
            throw PlayerError.jsConversionFailure
        }

        if !success {
            throw JSValueError.createInstance(value: resultValue)
        }
        
        return resultValue
    }
}

/**
 Represents the different errors that occur when evaluating JSValue
 */
public struct JSValueError: CreatedFromJSValue, ErrorWithMetadata {
    private static let defaultMessage: String  = "Unknown JS Error"
    private static let defaultType: ErrorTypes  = .unknown("")

    public let message: String
    public let type: ErrorTypes
    public let severity: ErrorSeverity?
    public let metadata: [String: Any]?
    public var jsDescription: String { message }

    /// Flag to determine if the javascript error conformed to the ErrorWithMetadata protocol
    public let isErrorWithMetadata: Bool

    public let originalJSError: JSValue

    internal enum JSKeys {
        static let message = "message"
        static let type = "type"
        static let severity = "severity"
        static let metadata = "metadata"
    }

    public static func createInstance(value: JSValue) -> JSValueError {
        return JSValueError(value)
    }

    public init(_ jsErrorObject: JSValue) {
        originalJSError = jsErrorObject
        guard
            let context = jsErrorObject.context,
            let errorClass = context.getJSClass(.error),
            jsErrorObject.isInstance(of: errorClass)
        else {
            message = JSValueError.defaultMessage
            type = JSValueError.defaultType
            severity = nil
            metadata = nil
            isErrorWithMetadata = false
            return
        }
        
        if let messageProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.message), messageProperty.isString == true {
            message = messageProperty.toString()
        } else {
            message = JSValueError.defaultMessage
        }
        
        if let typeProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.type), typeProperty.isString == true {
            isErrorWithMetadata = true
            type = ErrorTypes(typeProperty.toString())
        } else {
            isErrorWithMetadata = false
            type = JSValueError.defaultType
        }
        
        severity = ErrorSeverity(rawValue: jsErrorObject.objectForKeyedSubscript(JSKeys.severity)?.toString() ?? "")
        metadata = jsErrorObject.objectForKeyedSubscript(JSKeys.metadata)?.toDictionary() as? [String: Any]
    }
}

