//
//  AnyType.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/17/20.
//

import Foundation

/**
 A union type to match the JS core players any type
 */
public enum AnyType: Hashable {
    /// The underlying data was a string
    case string(data: String)

    /// The underlying data was a dictionary
    case dictionary(data: [String: String])

    /// The underlying data was an array of strings
    case array(data: [String])

    /// The underlying data was not in a known format
    case unknownData
}

/**
 Make AnyType Decodable
 */
extension AnyType: Decodable {
    /**
     Construct AnyType by decoding
     - parameters:
        - decoder: A decoder to decode from
     */
    public init(from decoder: Decoder) throws {
        if let dictionary = try? decoder.singleValueContainer().decode([String: String].self) {
            self = .dictionary(data: dictionary)
            return
        } else if let stringArray = try? decoder.singleValueContainer().decode([String].self) {
            self = .array(data: stringArray)
            return
        } else if let string = try? decoder.singleValueContainer().decode(String.self) {
            self = .string(data: string)
            return
        }
        self = .unknownData
        return
    }
}

/**
 Make AnyType Encodable
 */
extension AnyType: Encodable {
    /**
     Encode to an encoder
     - parameters:
        - encoder: The encoder to encode the value to
     */
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let string):
            try container.encode(string)
        case .array(let stringArray):
            try container.encode(stringArray)
        case .dictionary(let dictionary):
            try container.encode(dictionary)
        default:
            try container.encodeNil()
            return
        }
    }
}
