import Foundation
import JavaScriptCore

/// A parser for creating bindings from a string
public class BindingParser {
    internal var value: JSValue?
    internal var options: BindingParserOptions

    /// Create a BindingParser
    /// - Parameters:
    ///   - options: Required options to pass to the core BindingParser
    ///   - context: The JSContext to create in
    public init(options: BindingParserOptions, in context: JSContext) {
        self.options = options
        let getCallback: @convention(block) (JSValue) -> JSValue? = { binding in
            let binding = BindingInstance(from: binding)
            return options.get(binding)
        }
        value = context
            .getClassReference("Player.BindingParser", load: { $0.loadCore() })?
            .construct(withArguments: [[
                "get": JSValue(object: getCallback, in: context) as Any
            ]])
    }

    /// Parse a string into a binding
    /// - Parameter path: The path to parse into a binding
    /// - Returns: a BindingInstance fromt the parsed path
    public func parse(path: String) -> BindingInstance? {
        value?
            .invokeMethod("parse", withArguments: [path])
            .map { BindingInstance(from: $0) }
    }
}

/// A path in the data model
public class BindingInstance {
    internal var value: JSValue?

    /// Create a BindingInstance, a path to data in the data model
    /// - Parameters:
    ///   - rawBinding: The string representation of the path
    ///   - context: The JSContext to create in
    public init(rawBinding: String, in context: JSContext) {
        value = context
            .getClassReference("Player.BindingInstance", load: { $0.loadCore() })?
            .construct(withArguments: [rawBinding])
    }

    /// Create a BindingInstance from an existing JSValue reference
    /// - Parameter value: The JSValue that represents a JavaScript BindingInstance
    public init(from value: JSValue?) {
        self.value = value
    }

    /// Retrieve this Binding as an array
    /// - Returns: The array of segments in the binding
    public func asArray() -> [String]? {
        return value?
            .invokeMethod("asArray", withArguments: [])
            .toArray()
            /// Array indices are automatically treated as ints, so we need to map
            .map { $0 as? String ?? String(describing: $0) }
    }

    /// Retrieve this Binding as its string form
    /// - Returns: The string representation of this binding
    public func asString() -> String? {
        return value?.invokeMethod("asString", withArguments: []).toString()
    }
}

/// Options for ``BindingParser``
public struct BindingParserOptions {
    /// Get the value for a specific binding
    public var get: (BindingInstance) -> JSValue?

    /// Create BindingParserOptions
    /// - Parameter get: A callback to retrieve nested values
    public init(
        get: @escaping (BindingInstance) -> JSValue?
    ) {
        self.get = get
    }
}

/// A data model that stores things in an in-memory JS object
public class LocalModel {
    /// Reference to the JavaScript LocalModel
    internal var value: JSValue?

    /// Create a new LocalModel
    /// - Parameters:
    ///   - data: The data to start with
    ///   - context: The JSContext to create it in
    public init(data: [String: Any] = [:], in context: JSContext) {
        value = context.getClassReference("Player.LocalModel", load: { $0.loadCore() })?.construct(withArguments: [data])
    }

    /// Get a value in the model for a given binding
    /// - Parameter binding: The binding for where the data is
    /// - Returns: The data at the binding
    public func get(binding: BindingInstance) -> JSValue? {
        value?.invokeMethod("get", withArguments: [binding.value as Any])
    }

    /// Set data in the model
    /// - Parameter transaction: An array of transaction objects, tuples of ``BindingInstance`` and the value to set
    public func set(transaction: [(BindingInstance, Any)]) {
        value?.invokeMethod("set", withArguments: [transaction.map { [$0.0.value as Any, $0.1] as [Any] }])
    }

    /// Get a value in the model for a given path
    /// - Parameter path: The string path to use for creating a binding
    /// - Returns: The data at the path
    public func get(path: String) -> JSValue? {
        let binding = value?.context.map { BindingInstance(rawBinding: path, in: $0) }
        return binding.flatMap { get(binding: $0) }
    }
}
