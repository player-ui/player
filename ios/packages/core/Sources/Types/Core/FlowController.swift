//
//  File.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
A wrapper around the JS FlowController in the core player
*/
public class FlowController: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = FlowController

    /**
    Creates an instance from a JSValue, used for generic construction
    - parameters:
       - value: The JSValue to construct from
    */
    public static func createInstance(value: JSValue) -> FlowController { FlowController(value) }

    /// The JSValue that backs this wrapper
    public let value: JSValue

    /// The hooks that can be tapped into
    public let hooks: FlowControllerHooks

    /// The current flow for this controller
    public var current: Flow? {
        value.objectForKeyedSubscript("current").map { Flow($0) }
    }

    /**
    Construct a FlowController from a JSValue
    - parameters:
       - value: The JSValue that is the FlowController
    */
    public init(_ value: JSValue) {
        self.value = value
        hooks = FlowControllerHooks(flow: Hook(baseValue: value, name: "flow"))
    }

    /**
     Transition the FlowController with a given action
     - parameters:
        - action: The action to use for transitioning
     */
    public func transition(with action: String) {
        value.invokeMethod("transition", withArguments: [action])
    }
}

