//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {
    
    internal enum TryCatchResultKeys: String {
        case success, result
    }


    /**
     A way to catch errors for functions not called inside a player process. Can be called on functions with a return value and void with discardableResult.
     - parameters:
        - args: List of arguments taken by the function
     */
    @discardableResult
    public func tryCatch(args: Any...) throws -> JSValue? {
        var tryCatchWrapper: JSValue? {
            self.context.evaluateScript(
            """
               (fn, args) => {
                   try {
                       return {
                           \(TryCatchResultKeys.result.rawValue): fn(...args),
                           \(TryCatchResultKeys.success.rawValue): true
                       }
                   } catch(error) {
                       return {
                           \(TryCatchResultKeys.result.rawValue): error,
                           \(TryCatchResultKeys.success.rawValue): false
                       }
                   }
               }
            """)
        }
        
        let result = tryCatchWrapper?.call(withArguments: [self, args])
        guard
            let success = result?.objectForKeyedSubscript(TryCatchResultKeys.success.rawValue)?.toBool(),
            let resultValue = result?.objectForKeyedSubscript(TryCatchResultKeys.result.rawValue)
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
public struct JSValueError: Error, CreatedFromJSValue {
    private static let DEFAULT_MESSAGE: String  = "Unknown JS Error"
    private static let DEFAULT_TYPE: String  = ""
    
    public let message: String
    public let type: String
    public let severity: ErrorSeverity?
    public let metadata: [String: Any]?
    
    public let originalJSError: JSValue
    
    internal enum JSKeys: String {
        case message, type, severity, metadata
    }
    
    public static func createInstance(value: JSValue) -> JSValueError {
        return JSValueError(value)
    }
    
    public init(_ jsErrorObject: JSValue) {
        originalJSError = jsErrorObject
        if !jsErrorObject.isInstance(of: jsErrorObject.context.getJSClass(.Error)) {
            message = JSValueError.DEFAULT_MESSAGE
            type = JSValueError.DEFAULT_TYPE
            severity = nil
            metadata = nil
            return
        }
        
        if let messageProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.message.rawValue), messageProperty.isString == true {
            message = messageProperty.toString()
        } else {
            message = JSValueError.DEFAULT_MESSAGE
        }
        
        if let typeProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.type.rawValue), typeProperty.isString == true {
            type = typeProperty.toString()
        } else {
            type = JSValueError.DEFAULT_TYPE
        }
        
        severity = ErrorSeverity(rawValue: jsErrorObject.objectForKeyedSubscript(JSKeys.severity.rawValue)?.toString() ?? "")
        metadata = jsErrorObject.objectForKeyedSubscript(JSKeys.metadata.rawValue)?.toDictionary() as? [String: Any]
    }
}

extension JSValueError: ErrorWithMetadata {
    public var hasMetadata: Bool {
        !type.isEmpty
    }
}

extension JSValueError: JSConvertibleError {
    public var jsDescription: String {
        message
    }
}
