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
    public func tap(_ hook: @escaping (T, U) -> Void) {
        let tapMethod: @convention(block) (JSValue?, JSValue?) -> Void = { value, value2 in
            guard
                let val = value,
                let val2 = value2,
                let hookValue = T.createInstance(value: val) as? T,
                let hookValue2 = U.createInstance(value: val2) as? U
            else { return }
            hook(hookValue, hookValue2)
        }

        self.hook.invokeMethod("tap", withArguments: [name, JSValue(object: tapMethod, in: context) as Any])
    }
}
