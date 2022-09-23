//
//  DataController.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
A wrapper around the JS DataController in the core player
*/
open class BaseDataController {

    /// The JSValue that backs this wrapper
    public let value: JSValue

    /**
    Construct a DataController from a JSValue
    - parameters:
       - value: The JSValue that is the DataController
    */
    public init(_ value: JSValue) {
        self.value = value
    }

    /**
     Gets the underlying model from the DataController
     - returns: A JSValue representing the model
     */
    public func getModel() -> JSValue? {
        return self.value.invokeMethod("getModel", withArguments: [])
    }

    /**
     Sets new data for the given transaction
     - parameters:
        - transaction: The transaction to process
     */
    open func set(transaction: RawSetTransaction) {
        self.value.invokeMethod("set", withArguments: [transaction])
    }

    /**
     Gets the value of a given binding
     - parameters:
        - binding: The binding to fetch data for
     - returns: The data for the binding
     */
    public func get(binding: RawBinding) -> Any? {
        return self.value.invokeMethod("get", withArguments: [binding])?.toObject()
    }
}
/// A dictionary representing a transaction
public typealias RawSetTransaction = [String: Any]

/// Typealias representing a RawBindingSegment
public typealias RawBindingSegment = String

/// Typealias representing a RawBinding
public typealias RawBinding = String

public class DataController: BaseDataController, CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = DataController

    /**
    Creates an instance from a JSValue, used for generic construction
    - parameters:
       - value: The JSValue to construct from
    */
    public static func createInstance(value: JSValue) -> DataController { DataController(value) }

    /**
    Construct a DataController from a JSValue
    - parameters:
       - value: The JSValue that is the DataController
    */
    public override init(_ value: JSValue) {
        super.init(value)
    }
}
