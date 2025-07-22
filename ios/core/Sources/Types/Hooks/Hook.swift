//
//  Hook.swift
//
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/// A base for implementing JS backed hooks
open class BaseJSHook {
    private let baseValue: JSValue
    
    /// The JS reference to the hook
    public var hook: JSValue { baseValue.objectForKeyedSubscript("hooks").objectForKeyedSubscript(name) }
    
    /// The JSContext for the hook
    public var context: JSContext { hook.context }
    
    /// The name of the hook
    public let name: String
    
    /// Retrieves a hook by name from an object in JS
    /// - Parameters:
    ///   - baseValue: The object that has `hooks`
    ///   - name: The name of the hook
    public init(baseValue: JSValue, name: String) {
        self.baseValue = baseValue
        self.name = name
    }
}

/// A base for implementing JS backed async hooks with promise support
open class BaseAsyncJSHook: BaseJSHook {
    /// Creates a promise with common error handling for async operations
    /// - Parameter asyncWork: The async work to execute
    /// - Returns: A JavaScript promise
    internal func createAsyncPromise<Result>(_ asyncWork: @escaping () async throws -> Result) -> JSValue {
        let promise = JSUtilities.createPromise(context: self.context) { (resolve, reject) in
            Task {
                do {
                    let result = try await asyncWork()
                    DispatchQueue.main.async {
                        resolve(result as Any)
                    }
                } catch let error {
                    let message = error.playerDescription
                    DispatchQueue.main.async {
                        reject("Async hook threw with error '\(message)'")
                    }
                }
            }
        }
        return promise ?? JSValue()
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events
 */
public class Hook<T>: BaseJSHook where T: CreatedFromJSValue {
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping (T) -> Void) {
        let tapMethod: @convention(block) (JSValue?) -> Void = { value in
            guard
                let val = value,
                let hookValue = T.createInstance(value: val) as? T
            else { return }
            hook(hookValue)
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events that has 2 parameters
 */
public class Hook2<T, U>: BaseJSHook where T: CreatedFromJSValue, U: CreatedFromJSValue {
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap<R>(_ hook: @escaping (T, U) -> R) {
        let tapMethod: @convention(block) (JSValue?, JSValue?) -> Any? = { value, value2 in
            guard
                let val = value,
                let val2 = value2,
                let hookValue = T.createInstance(value: val) as? T,
                let hookValue2 = U.createInstance(value: val2) as? U
            else { return nil }
            return hook(hookValue, hookValue2)
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events
 */
public class HookDecode<T>: BaseJSHook where T: Decodable {
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping (T) -> Void) {
        let tapMethod: @convention(block) (JSValue?) -> Void = { value in
            guard
                let val = value,
                let hookValue = try? JSONDecoder().decode(T.self, from: val)
            else { return }
            hook(hookValue)
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events that has 2 parameters
 */
public class Hook2Decode<T, U>: BaseJSHook where T: Decodable, U: Decodable {
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping (T, U) -> Void) {
        let tapMethod: @convention(block) (JSValue?, JSValue?) -> Void = { value, value2 in
            
            let decoder = JSONDecoder()
            guard
                let val = value,
                let val2 = value2,
                let hookValue = try? decoder.decode(T.self, from: val),
                let hookValue2 = try? decoder.decode(U.self, from: val2)
            else { return }
            hook(hookValue, hookValue2)
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events that has 3 parameters
 */
public class Hook3Decode<T, U, S>: BaseJSHook where T: Decodable, U: Decodable, S: Decodable {
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime

     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping (T, U, S) -> Void) {
        let tapMethod: @convention(block) (JSValue?, JSValue?, JSValue?) -> Void = { value, value2, value3 in

            let decoder = JSONDecoder()
            guard
                let val = value,
                let val2 = value2,
                let val3 = value3,
                let hookValue = try? decoder.decode(T.self, from: val),
                let hookValue2 = try? decoder.decode(U.self, from: val2),
                let hookValue3 = try? decoder.decode(S.self, from: val3)
            else { return }
            hook(hookValue, hookValue2, hookValue3)
        }

        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 and returns a promise that resolves when the asynchronous task is completed
 */
public class AsyncHook<T>: BaseAsyncJSHook where T: CreatedFromJSValue {
    public typealias AsyncHookHandler = (T) async throws -> JSValue?
    
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping AsyncHookHandler) {
        let tapMethod: @convention(block) (JSValue?) -> JSValue = { value in
            guard
                let val = value,
                let hookValue = T.createInstance(value: val) as? T
            else { return JSValue() }
            
            return self.createAsyncPromise {
                try await hook(hookValue)
            }
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events that has 2 parameters and
 returns a promise that resolves when the asynchronous task is completed
 */
public class AsyncHook2<T, U>: BaseAsyncJSHook where T: CreatedFromJSValue, U: CreatedFromJSValue {
    public typealias AsyncHookHandler = (T, U) async throws -> JSValue?
    
    /**
     Attach a closure to the hook, so when the hook is fired in the JS runtime
     we receive the event in the native runtime
     
     - parameters:
     - hook: A function to run when the JS hook is fired
     */
    public func tap(_ hook: @escaping AsyncHookHandler) {
        let tapMethod: @convention(block) (JSValue?,JSValue?) -> JSValue = { value, value2 in
            guard
                let val = value,
                let val2 = value2,
                let hookValue = T.createInstance(value: val) as? T,
                let hookValue2 = U.createInstance(value: val2) as? U
            else { return JSValue() }
            
            return self.createAsyncPromise {
                try await hook(hookValue, hookValue2)
            }
        }
        
        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}
