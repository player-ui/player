//
//  JSValue+Extensions.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-01-18.
//

import Foundation
import JavaScriptCore

extension JSValue {


    /**
     A way to catch errors for functions not called inside a player process. Can be called on functions with a return value and void with discardableResult.
     - parameters:
        - args: List of arguments taken by the function
     */
    @discardableResult
    public func tryCatch(args: Any...) throws(JSValueError) -> JSValue? {
        var tryCatchWrapper: JSValue? {
            self.context.evaluateScript(
            """
               (fn, args) => {
                   try {
                       return {
                           result: fn(...args),
                           success: true
                       }
                   } catch(e) {
                       return {
                           result: e,
                           success: false
                       }
                   }
               }
            """)
        }

        
        let result = tryCatchWrapper?.call(withArguments: [self, args])
        let success = result?.objectForKeyedSubscript("success")?.toBool()
        let resultValue = result?.objectForKeyedSubscript("result")

        if success! {
            return resultValue
        } else {
            throw JSValueError.createInstance(value: resultValue!)
        }
    }
}

/**
 Represents the different errors that occur when evaluating JSValue
 */
public enum JSValueError: Error {
    case simpleJsError(jsError: JSValue, message: String)
    case errorWithMetadata(jsError: JSValue, message: String, type: String, severity: ErrorSeverity?, metadata: [String: Any]?)
    case unknownError(jsError: JSValue)
    
    func getJSErrorObject() -> JSValue {
        switch self {
        case .simpleJsError(let jsError, _):
            return jsError
        case .errorWithMetadata(let jsError, _, _, _, _):
            return jsError
        case .unknownError(let jsError):
            return jsError
        }
    }
}

extension JSValueError: CreatedFromJSValue {
    public static func createInstance(value: JSValue) -> JSValueError {
        if (!value.isInstance(of: value.context.objectForKeyedSubscript("Error"))) {
            return JSValueError.unknownError(jsError: value)
        }
        
        let message = value.objectForKeyedSubscript("message")
        if (message?.isString != true) {
            return JSValueError.unknownError(jsError: value)
        }
        
        let type = value.objectForKeyedSubscript("type")
        if (type?.isString != true) {
            return JSValueError.simpleJsError(jsError: value, message: message!.toString()!)
        }
        
        let severity = ErrorSeverity(rawValue: value.objectForKeyedSubscript("severity")?.toString() ?? "")
        let metadata = value.objectForKeyedSubscript("metadata")?.toDictionary() as? [String: Any]
        return JSValueError.errorWithMetadata(jsError: value, message: message!.toString()!, type: type!.toString()!, severity: severity, metadata: metadata)
    }
}

extension JSValueError: ErrorWithMetadata {
    public var hasMetadata: Bool {
        switch self {
        case .errorWithMetadata(_, _, _, _, _):
            return true
        default:
            return false
        }
    }
    
    public var type: String {
        switch self {
        case .errorWithMetadata(_, _, let type, _, _):
            return type
        default:
            return "UNKNOWN"
        }
    }
    
    public var severity: ErrorSeverity? {
        switch self {
        case .errorWithMetadata(_, _, _, let severity, _):
            return severity
        default:
            return nil
        }
    }
    
    public var metadata: [String: Any]? {
        switch self {
        case .errorWithMetadata(_, _, _, _, let metadata):
            return metadata
        default:
            return nil
        }
    }
}

extension JSValueError: JSConvertibleError {
    public var jsDescription: String {
        switch self {
        case .simpleJsError(_, let message):
            return message
        case .errorWithMetadata(_, let message, _, _, _):
            return message
        case .unknownError:
            return "Unknown JS Error"
        }
    }
}
