//
//  Modifiers.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/21/20.
//

import Foundation

/**
 MetaData associated with a `Modifier`
 */
public struct ModifierMetaData: Decodable, Hashable {
    /// A ref for the link modifier
    public let ref: String?
    public let source: String?
    public let mimeType: String?
    public let maxLine: Int?

    /**
     Create a ModifierMetaData instance
     */
    public init(ref: String?, source: String? = nil, mimeType: String? = nil, maxLine: Int? = nil) {
        self.ref = ref
        self.source = source
        self.mimeType = mimeType
        self.maxLine = maxLine
    }

    private enum CodingKeys: String, CodingKey {
        case ref
        case source
        case mimeType = "mime-type"
        case maxLine
    }
}
/**
 A modifier for an asset
 */
public typealias Modifier = ModifierContainer<ModifierMetaData>

/**
 A ModifierContainer allows any type of MetaData to be decoded from an asset tree.
 */
public struct ModifierContainer<MetaData>: Decodable, Hashable where MetaData: Decodable&Hashable {
    /// The type of modifier
    public let type: String

    /// The value to use for this modification
    private let _value: JSONValue?

    /// Optional name of a modifier to use as reference in a string
    public let name: String?

    /// metaData
    public let metaData: MetaData?

    /**
     Create  a Modifier instance
     */
    public init(type: String, value: JSONValue? = nil, name: String? = nil, metaData: MetaData? = nil) {
        self.type = type
        self._value = value
        self.name = name
        self.metaData = metaData
    }

    public typealias JSONValue = PlayerUI.JSONValue
}

/// A JSONValue might contain a string, or a number (either int or double).
public enum JSONValue: Hashable {
    case string (String)
    case integer(Int)
    case double (Double)

    public var stringValue: String? {
        guard case .string(let string) = self else { return nil }
        return string
    }

    var intValue: Int? {
        guard case .integer(let int) = self else { return nil }
        return int
    }

    var doubleValue: Double? {
        guard case .double(let double) = self else { return nil }
        return double
    }
}

public extension ModifierContainer {
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        try self.init(
                type: container.decode(String.self, forKey: .type),
               value: container.decodeIfPresent(JSONValue.self, forKey: .value),
                name: container.decodeIfPresent(String.self, forKey: .name),
            metaData: container.decodeIfPresent(MetaData.self, forKey: .metaData)
        )
    }

    init(type: String, value: String, name: String? = nil, metaData: MetaData? = nil) {
        self.init(type: type, value: .string(value), name: name, metaData: metaData)
    }

    var value: String? { _value?.stringValue }

    var intValue: Int? { _value?.intValue }

    var doubleValue: Double? { _value?.doubleValue }

    private enum CodingKeys: String, CodingKey {
        case name
        case type
        case value
        case metaData
    }
}

extension JSONValue: Decodable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        // attempt to decode a string, then an int, then a double, then fail
        self = try
            (try? .string(container.decode(String.self))) ??
            (try? .integer(container.decode(Int.self   ))) ??
            (try  .double(container.decode(Double.self)))
    }
}
