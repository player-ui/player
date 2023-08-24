//
//  File.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
 A protocol for objects that are constructed generically from a JSValue
 This is used for hooks
 */
public protocol CreatedFromJSValue {
    /**
     Creates an instance of the associated type using the JSValue
     - parameters:
        - value: The value to use for construction
     - returns:
        An instance of the associated type
     */
    static func createInstance(value: JSValue) -> T

    /// The type associated with this instance
    associatedtype T
}

/**
 Allows a JSValue to be created from itself for debugging purposes
 */
extension JSValue: CreatedFromJSValue {
    /// The type used for generic creation
    public typealias T = JSValue

    /**
     Returns this JSValue for debugging
     - parameters:
        - value: The JSValue to use for creation
     */
    public static func createInstance(value: JSValue) -> JSValue { value }
}

extension Optional: CreatedFromJSValue where Wrapped: CreatedFromJSValue {
    public static func createInstance(value: JSValue) -> Wrapped.T? {
        guard !value.isUndefined else { return nil }
        return Wrapped.createInstance(value: value)
    }
}
