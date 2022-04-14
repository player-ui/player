//
//  Hook.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
 This class represents an object in the JS runtime that can be tapped into
 to receive JS events
 */
public class Hook<T> where T: CreatedFromJSValue {
    /// The JS Binding to the hook object
    private let hook: JSValue

    /// The JSContext in which the hook is bound
    private let context: JSContext

    /// The name of the hook
    private let name: String

    /**
     Constructs a hook
     - parameters:
        - baseValue: The JS binding to the hooks object
        - name: The name of the hook
     */
    public init(baseValue: JSValue, name: String) {
        self.context = baseValue.context
        self.name = name
        guard
            let hooks = baseValue.objectForKeyedSubscript("hooks"),
            let hookToTap = hooks.objectForKeyedSubscript(name)
        else {
            fatalError("Player hook not found: \(name)")
        }
        self.hook = hookToTap
    }

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
