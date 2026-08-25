import Foundation
import JavaScriptCore
import PlayerUI

/// Keys read off the JS-side frozen snapshot object.
private enum JSKey {
    static let entries = "entries"
    static let flowId = "flowId"
    static let endedAt = "endedAt"
    static let name = "name"
    static let description = "description"
    static let value = "value"
}

/// A frozen snapshot of the context store captured when a flow ends.
///
/// Read entries by name with the same typed access as live context:
/// `snapshot.get(name: "player.state", as: PlayerStateContext.self)`. The raw
/// entry `JSValue`s are retained so function-valued entries decode into
/// callable `WrappedFunction`s (a frozen action's tombstone throws when called).
public struct FrozenContextSnapshot {
    public let flowId: String?
    public let endedAt: Double
    public let entries: [FrozenContextEntry]

    /// Raw per-name entry JSValues, retained for typed `get`.
    private let entryValues: [String: JSValue]

    public struct FrozenContextEntry: Decodable {
        public let name: String?
        public let description: String
    }

    init?(_ snapshot: JSValue?) {
        guard let snapshot, !snapshot.isUndefined, !snapshot.isNull,
              let entriesValue = snapshot.objectForKeyedSubscript(JSKey.entries),
              let entriesArray = entriesValue.toArray() else { return nil }

        flowId = snapshot.objectForKeyedSubscript(JSKey.flowId)?.toString()
        endedAt = snapshot.objectForKeyedSubscript(JSKey.endedAt)?.toDouble() ?? 0

        var entries = [FrozenContextEntry]()
        var values = [String: JSValue]()
        for index in 0 ..< entriesArray.count {
            guard let entry = entriesValue.objectAtIndexedSubscript(index) else { continue }
            let name = entry.objectForKeyedSubscript(JSKey.name)?.toString()
            let description = entry.objectForKeyedSubscript(JSKey.description)?.toString() ?? ""
            entries.append(FrozenContextEntry(name: name, description: description))
            if let name, let value = entry.objectForKeyedSubscript(JSKey.value) {
                values[name] = value
            }
        }
        self.entries = entries
        entryValues = values
    }

    /// Read a frozen entry by `name`, decoded into a `Decodable` type `T` — the
    /// same typed access as live context. Returns nil if the entry was absent
    /// when the snapshot froze or fails to decode.
    public func get<T: Decodable>(name: String, as _: T.Type = T.self) -> T? {
        guard let value = entryValues[name],
              let object = value.toObject(),
              // `fragmentsAllowed` so primitive entries (a bare string or
              // number) serialize too — they are not valid top-level JSON.
              let data = try? JSONSerialization.data(
                  withJSONObject: object,
                  options: [.fragmentsAllowed]
              ) else { return nil }
        // Mirrors `ContextPlugin.get(name:as:)`: `T` may carry `AnyType`
        // members, which require an AnyTypeDecodingContext to decode.
        return try? AnyTypeDecodingContext(rawData: data)
            .inject(to: JSONDecoder())
            .decode(T.self, from: value)
    }
}
