//
//  File.swift
//  
//
//  Created by Borawski, Harris on 2/13/20.
//

import Foundation
import JavaScriptCore

/**
A wrapper for debugging to fake-decode JSValues, so they can be inspected in the debugger
*/
public class DebugValue: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = DebugValue

    /**
    Creates an instance from a JSValue, used for generic construction
    - parameters:
       - value: The JSValue to construct from
    */
    public static func createInstance(value: JSValue) -> DebugValue { DebugValue(value) }

    /// The JSValue that backs this wrapper
    public let value: JSValue

    /**
    Construct a DebugValue from a JSValue, for debugging unknown return types on JSValues
    - parameters:
       - value: The JSValue that is the value to debug
    */
    public init(_ value: JSValue) {
        self.value = value
    }
}
