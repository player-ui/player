//
//  Flow.swift
//
//
//  Created by Borawski, Harris on 2/13/20.
//

import Foundation
import JavaScriptCore

/**
A wrapper around the JS Flow in the core player
*/
public class Flow: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = Flow

    /// The ID of this flow
    public var id: String? { value.objectForKeyedSubscript("id")?.toString() }

    /// The original data associated with this flow
    public var data: [String: Any]? { value.objectForKeyedSubscript("data")?.toObject() as? [String: Any] }

    /// The name of this flow
    public var currentState: NamedState? { value.objectForKeyedSubscript("currentState").map { NamedState($0) } }

    /// Lifecycle hooks
    public let hooks: FlowHooks

    /**
    Creates an instance from a JSValue, used for generic construction
    - parameters:
       - value: The JSValue to construct from
    */
    public static func createInstance(value: JSValue) -> Flow { Flow(value) }

    /// The JSValue that backs this wrapper
    private let value: JSValue

    /**
    Construct a Flow from a JSValue
    - parameters:
       - value: The JSValue that is the Flow
    */
    public init(_ value: JSValue) {
        self.value = value
        hooks = FlowHooks(
            beforeTransition: WaterfallHook2(baseValue: value, name: "beforeTransition"),
            transition: Hook2(baseValue: value, name: "transition"),
            afterTransition: Hook(baseValue: value, name: "afterTransition")
        )
    }
}

public struct FlowHooks {
    /// A hook that fires before a transition, with the current state and transition value. The handler receives
    /// (state as JSValue, transitionValue as String) and must return the state as JSValue (pass-through or modified).
    public var beforeTransition: WaterfallHook2

    /// A hook that fires when transitioning states and giving the old and new states as parameters
    public var transition: Hook2<NamedState?, NamedState>

    /// A hook that fires after a transition occurs giving the FlowInstance as parameter
    public var afterTransition: Hook<Flow>
}

public struct NamedState: CreatedFromJSValue {
    public typealias T = NamedState

    public static func createInstance(value: JSValue) -> NamedState { .init(value) }

    /// The name of the navigation node
    public let name: String

    /// The navigation node itself
    public let value: NavigationBaseState?

    init(_ value: JSValue) {
        self.name = value.objectForKeyedSubscript("name").toString()
        self.value = NavigationBaseState.createInstance(value: value.objectForKeyedSubscript("value"))
    }
}
