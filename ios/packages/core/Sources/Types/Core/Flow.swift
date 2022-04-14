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
    }
}
