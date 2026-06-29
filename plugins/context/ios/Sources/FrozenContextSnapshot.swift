import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

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
        guard let snapshot = snapshot, !snapshot.isUndefined, !snapshot.isNull,
              let entriesValue = snapshot.objectForKeyedSubscript("entries"),
              let entriesArray = entriesValue.toArray() else { return nil }

        self.flowId = snapshot.objectForKeyedSubscript("flowId")?.toString()
        self.endedAt = snapshot.objectForKeyedSubscript("endedAt")?.toDouble() ?? 0

        var entries: [FrozenContextEntry] = []
        var values: [String: JSValue] = [:]
        for index in 0..<entriesArray.count {
            guard let entry = entriesValue.objectAtIndexedSubscript(index) else { continue }
            let name = entry.objectForKeyedSubscript("name")?.toString()
            let description = entry.objectForKeyedSubscript("description")?.toString() ?? ""
            entries.append(FrozenContextEntry(name: name, description: description))
            if let name = name, let value = entry.objectForKeyedSubscript("value") {
                values[name] = value
            }
        }
        self.entries = entries
        self.entryValues = values
    }

    /// Read a frozen entry by `name`, decoded into a `Decodable` type `T` — the
    /// same typed access as live context. Returns nil if the entry was absent
    /// when the snapshot froze or fails to decode.
    public func get<T: Decodable>(name: String, as type: T.Type = T.self) -> T? {
        guard let value = entryValues[name] else { return nil }
        return try? JSONDecoder().decode(T.self, from: value)
    }
}
