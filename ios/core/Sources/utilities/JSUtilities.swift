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
            let promise = context.evaluateScript("Promise")?.construct(withArguments: [closure])
        else { return nil }
        return promise
    }
}

internal extension JSContext {
    func error<E>(for error: E) -> JSValue? where E: Error, E: JSConvertibleError {
        objectForKeyedSubscript("Error").construct(withArguments: [error.jsDescription])
    }
}

/// An error that has a custom way to display its message when converted to JavaScriptCore
public protocol JSConvertibleError {
    /// The description to use when send to JavaScriptCore
    var jsDescription: String { get }
}
