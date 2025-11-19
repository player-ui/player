//
//  JSLogger.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
 The logger instance from the actively running player
 */
public struct JSLogger {
    /// The JSValue that backs this object
    private var value: JSValue

    /**
    Construct a JSLogger from a JSValue
    - parameters:
       - value: The JSValue that is the DataController
    */
    public init?(from value: JSValue?) {
        guard let value = value else { return nil}
        self.value = value
    }

    /**
     Used to log trace messages
     - parameters:
        - items: The parts of the message to log
     */
    public func trace(_ items: String...) {
        value.invokeMethod("trace", withArguments: items)
    }

    /**
     Used to log debug messages
     - parameters:
        - items: The parts of the message to log
     */
    public func debug(_ items: String...) {
        value.invokeMethod("debug", withArguments: items)
    }

    /**
     Used to log info messages
     - parameters:
        - items: The parts of the message to log
     */
    public func info(_ items: String...) {
        value.invokeMethod("info", withArguments: items)
    }

    /**
     Used to log warn messages
     - parameters:
        - items: The parts of the message to log
     */
    public func warn(_ items: String...) {
        value.invokeMethod("warn", withArguments: items)
    }

    /**
     Used to log error messages
     - parameters:
        - items: The parts of the message to log
     */
    public func error(_ items: String...) {
        value.invokeMethod("error", withArguments: items)
    }
}
