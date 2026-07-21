import Foundation

/// Descriptor for a registered context entry, as returned by `ContextPlugin.list()`.
public struct ContextEntryDescriptor: Decodable {
    public let description: String
    public let hasValue: Bool
    public let hasTransform: Bool
}
