import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

/**
 A plugin that maintains a per-flow store of context entries keyed by string
 name and exposes a subscribe/get/set API for native consumers.
 */
public class ContextPlugin: JSBasePlugin, NativePlugin {
    public convenience init() {
        self.init(fileName: "ContextPlugin.native", pluginName: "ContextPlugin.ContextPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: ContextPlugin.self),
            pathComponent: "PlayerUI_ContextPlugin.bundle"
        )
        #endif
    }

    /// Store `value` under the context entry identified by `name`, registering
    /// a human-readable `description` for introspection consumers.
    public func set(name: String, description: String, value: AnyType?) {
        guard let pluginRef else { return }
        let jsValue = encode(value, in: pluginRef.context)
        pluginRef.invokeMethod("setByName", withArguments: [name, description, jsValue as Any])
    }

    /// Read the current value for the entry identified by `name`, or nil if unset.
    public func get(name: String) -> AnyType? {
        guard let pluginRef,
              let result = pluginRef.invokeMethod("getByName", withArguments: [name]) else { return nil }
        return decode(result)
    }

    /// Returns true if the entry identified by `name` has a value or transform.
    public func has(name: String) -> Bool {
        guard let pluginRef,
              let result = pluginRef.invokeMethod("hasByName", withArguments: [name]) else { return false }
        return result.toBool()
    }

    /// Subscribe to updates for the entry identified by `name`. The handler is
    /// invoked with the new value and the `name` whenever the entry changes.
    /// Returns a token usable with `unsubscribe`.
    @discardableResult
    public func subscribe(
        name: String,
        description: String,
        handler: @escaping (AnyType?, String) -> Void
    ) -> String? {
        guard let pluginRef else { return nil }
        let callback: @convention(block) (JSValue?, JSValue?) -> Void = { [weak self] value, _ in
            handler(self?.decode(value), name)
        }
        let jsCallback = JSValue(object: callback, in: pluginRef.context) as Any
        let token = pluginRef.invokeMethod("subscribeByName", withArguments: [name, description, jsCallback])
        return token?.toString()
    }

    /// Subscribe to every context update. The handler receives the new value,
    /// the resolved key name (or nil for non-namespaced keys), and description.
    @discardableResult
    public func subscribeAll(
        handler: @escaping (AnyType?, String?, String) -> Void
    ) -> String? {
        guard let pluginRef else { return nil }
        let callback: @convention(block) (JSValue?, JSValue?, JSValue?) -> Void = { [weak self] value, name, description in
            handler(self?.decode(value), name?.toString(), description?.toString() ?? "")
        }
        let jsCallback = JSValue(object: callback, in: pluginRef.context) as Any
        let token = pluginRef.invokeMethod("subscribeAllByName", withArguments: [jsCallback])
        return token?.toString()
    }

    /// Cancel the subscription registered with `token`.
    public func unsubscribe(token: String) {
        pluginRef?.invokeMethod("unsubscribe", withArguments: [token])
    }

    /// Read the entry identified by `name`, decoded into a `Decodable` type
    /// `T` — the same typed access as the JVM `get<T>(name)`. `T` may carry
    /// `WrappedFunction` members for function-valued fields, so a caller does
    /// `get(name:)?.flow.transition?("Next")`. Returns nil if the entry is
    /// unset or fails to decode.
    public func get<T: Decodable>(name: String, as type: T.Type = T.self) -> T? {
        guard let pluginRef,
              let result = pluginRef.invokeMethod("getByName", withArguments: [name]),
              !result.isUndefined, !result.isNull else { return nil }
        return try? JSONDecoder().decode(T.self, from: result)
    }

    /// Returns the registered entry descriptors (description + value/transform flags).
    public func list() -> [ContextEntryDescriptor] {
        guard let pluginRef,
              let result = pluginRef.invokeMethod("list", withArguments: []),
              !result.isUndefined, !result.isNull else { return [] }
        return (try? JSONDecoder().decode([ContextEntryDescriptor].self, from: result)) ?? []
    }

    /// Returns the stack of frozen snapshots from prior flows.
    public func history() -> [FrozenContextSnapshot] {
        guard let pluginRef,
              let result = pluginRef.invokeMethod("history", withArguments: []),
              !result.isUndefined, !result.isNull,
              let count = result.toArray()?.count else { return [] }
        return (0..<count).compactMap { FrozenContextSnapshot(result.objectAtIndexedSubscript($0)) }
    }

    private func encode(_ value: AnyType?, in context: JSContext) -> Any? {
        guard let value,
              let data = try? JSONEncoder().encode(value),
              let dataString = String(data: data, encoding: .utf8) else { return nil }
        return context.evaluateScript("(\(dataString))")
    }

    private func decode(_ value: JSValue?) -> AnyType? {
        guard let value, !value.isUndefined, !value.isNull else { return nil }
        if value.isString, let string = value.toString() {
            return .string(data: string)
        }
        // Primitives are not valid top-level JSON for JSONSerialization, so
        // handle them directly before falling back to object decoding.
        if value.isBoolean {
            return .bool(data: value.toBool())
        }
        if value.isNumber {
            return .number(data: value.toDouble())
        }
        guard let object = value.toObject(),
              let data = try? JSONSerialization.data(withJSONObject: object),
              let decoded = try? AnyTypeDecodingContext(rawData: data)
                  .inject(to: JSONDecoder())
                  .decode(AnyType.self, from: data) else { return nil }
        return decoded
    }
}
