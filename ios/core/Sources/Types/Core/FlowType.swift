//
//  FLowType.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2025-01-30.
//

import Foundation
import JavaScriptCore

/**
A wrapper around the JS FlowType in the core player
The JSON payload for running Player, different from the Flow class which is the Flow Instance which contains the navigation state machine
*/
public class FlowType: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = FlowType

    /// The ID of this flow
    public var id: String? { value.objectForKeyedSubscript("id")?.toString() }

    /// The original data associated with this flow
    public var data: [String: Any]? { value.objectForKeyedSubscript("data")?.toObject() as? [String: Any] }

    /**
    Creates an instance from a JSValue, used for generic construction
    - parameters:
       - value: The JSValue to construct from
    */
    public static func createInstance(value: JSValue) -> FlowType { FlowType(value) }

    /// The JSValue that backs this wrapper
    public private(set) var value: JSValue

    /**
    Construct a Flow from a JSValue
    - parameters:
       - value: The JSValue that is the Flow
    */
    public init(_ value: JSValue) {
        self.value = value
    }
}
