//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {
    
    public enum TryCatchResultKeys {
        static let success = "success"
        static let result = "result"
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
        
        let result = tryCatchWrapper?.call(withArguments: [self, args])
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
public struct JSValueError: Error, CreatedFromJSValue {
    private static let DEFAULT_MESSAGE: String  = "Unknown JS Error"
    private static let DEFAULT_TYPE: String  = ""
    
    public let message: String
    public let type: String
    public let severity: ErrorSeverity?
    public let metadata: [String: Any]?
    
    public let originalJSError: JSValue
    
    public enum JSKeys {
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
        if !jsErrorObject.isInstance(of: jsErrorObject.context.getJSClass(.Error)) {
            type = JSValueError.DEFAULT_MESSAGE
            message = JSValueError.DEFAULT_TYPE
            severity = nil
            metadata = nil
            return
        }
        
        if let messageProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.message), messageProperty.isString == true {
            message = messageProperty.toString()
        } else {
            message = JSValueError.DEFAULT_MESSAGE
        }
        
        if let typeProperty = jsErrorObject.objectForKeyedSubscript(JSKeys.type), typeProperty.isString == true {
            type = typeProperty.toString()
        } else {
            type = JSValueError.DEFAULT_TYPE
        }
        
        severity = ErrorSeverity(rawValue: jsErrorObject.objectForKeyedSubscript(JSKeys.severity)?.toString() ?? "")
        metadata = jsErrorObject.objectForKeyedSubscript(JSKeys.metadata)?.toDictionary() as? [String: Any]
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
