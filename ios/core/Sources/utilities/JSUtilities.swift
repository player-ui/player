//
//  JSUtilities.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/13/20.
//

import Foundation
import JavaScriptCore

/**
 Class to hold context-agnostic JS utility functions
 */
public class JSUtilities {
    /**
     Polyfills functions needed for plugins with native versions
     - parameters:
        - context: The context to polyfill
     */
    public static func polyfill(_ context: JSContext) {
        let setTimeout: @convention(block) (JSValue?, JSValue?) -> Void = { (function, timeout) in
            guard let function = function, let timeout = timeout?.toInt32() else { return }
            DispatchQueue
                .global(qos: .background)
                .asyncAfter(deadline: .now() + .milliseconds(Int(timeout)), execute: {
                    DispatchQueue.main.async {
                        function.call(withArguments: [])
                    }
            })
        }
        guard let val = JSValue(object: setTimeout, in: context) else { return }
        context.setObject(val, forKeyedSubscript: "setTimeout" as NSString)
    }

    /// A function used to indicate a promise has completed async operations successfully
    public typealias Resolve = (Any...) -> Void
    /// A function used to indicate a promise has failed to complete async operations
    public typealias Reject = (Any...) -> Void

    /**
     Creates a javascript promise in the given context, to execute native code
     - parameters:
        - context: The JSContext to create the promise in
        - handler: A completion handler that is used in place of the JS closure used to construct promises
     - returns: A reference to the promise in the context if successfully created
     */
    public static func createPromise(context: JSContext, handler: @escaping (@escaping Resolve, @escaping Reject) -> Void) -> JSValue? {
        let constructor: @convention(block) (JSValue, JSValue) -> Void = { resolve, reject in
            handler({(args: Any...) in
                    resolve.call(withArguments: args)
                }, {(args: Any...) in
                    reject.call(withArguments: args)
                }
            )
        }
        guard
            let closure = JSValue(object: constructor, in: context),
            let promise = context.constructClass(.Promise, withArguments: [closure])
        else { return nil }
        return promise
    }
}

internal enum JSClass: String {
    case Error
    case Promise
}

internal extension JSContext {
    func getJSClass(_ jsClass: JSClass) -> JSValue {
        objectForKeyedSubscript(jsClass.rawValue)
    }
    func constructClass(_ jsClass: JSClass, withArguments: [Any]?) -> JSValue? {
        getJSClass(jsClass).construct(withArguments: withArguments)
    }
    
    func error<E>(for error: E) -> JSValue? where E: Error, E: JSConvertibleError {
        if let jsValueError = error as? JSValueError {
            // If the error originated in JS, just return the original object
            return jsValueError.originalJSError
        }
        
        let errObj = constructClass(.Error, withArguments: [error.jsDescription])
        if let errorWithMetadata = error as? ErrorWithMetadata, let err = errObj, errorWithMetadata.hasMetadata {
            err.setValue(errorWithMetadata.type, forProperty: JSValueError.JSKeys.type.rawValue)
            err.setValue(errorWithMetadata.severity?.rawValue, forProperty: JSValueError.JSKeys.severity.rawValue)
            if let metadata = errorWithMetadata.metadata {
                err.setValue(metadata, forProperty: JSValueError.JSKeys.metadata.rawValue)
            }
        }
        
        return errObj
    }
}

/// An error that has a custom way to display its message when converted to JavaScriptCore
public protocol JSConvertibleError {
    /// The description to use when send to JavaScriptCore
    var jsDescription: String { get }
}

public protocol ErrorWithMetadata : Error {
    var hasMetadata: Bool { get }
    var type: String { get }
    var severity: ErrorSeverity? { get }
    var metadata: [String: Any]? { get }
}
