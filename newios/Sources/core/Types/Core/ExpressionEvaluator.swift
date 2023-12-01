//
//  ExpressionEvaluator.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/16/21.
//

import Foundation
import JavaScriptCore
/**
 A wrapper around the JS ExpressionEvaluator in the core player
 */
public class ExpressionEvaluator: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = ExpressionEvaluator

    /**
     Creates an instance from a JSValue, used for generic construction
     - parameters:
        - value: The JSValue to construct from
     */
    public static func createInstance(value: JSValue) -> ExpressionEvaluator { ExpressionEvaluator(value) }

    private let value: JSValue

    /**
     Creates an instance from a JSValue
     - parameters:
        - value: The JSValue to construct from
     */
    public init(_ value: JSValue) {
        self.value = value
    }

    /**
     Evaluate an expression and retrieve the result
     - parameters:
        - expression: The expression to evaluate
     - returns: A result if the expression produces one
     */
    @discardableResult public func evaluate(_ expression: String) -> Any? {
        return self.value.invokeMethod("evaluate", withArguments: [expression])?.toObject()
    }

    /**
     Evaluate an array expression and retrieve the result
     - parameters:
        - expressions: The expressions to evaluate
     - returns: A result if the expressions produces one
     */
    @discardableResult public func evaluate(_ expressions: [String]) -> Any? {
        return self.value.invokeMethod("evaluate", withArguments: [expressions])?.toObject()
    }
}
