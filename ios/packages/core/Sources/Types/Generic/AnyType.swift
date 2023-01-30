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

    /// The underlying data was a boolean
    case bool(data: Bool)

    /// The underlying data was a number
    case number(data: Double)

    /// The underlying data was a dictionary of strings
    case dictionary(data: [String: String])

    /// The underlying data was a dictionary of numbers
    case numberDictionary(data: [String: Double])

    /// The underlying data was a dictionary of booleans
    case booleanDictionary(data: [String: Bool])

    /// The underlying data was an array of strings
    case array(data: [String])

    /// The underlying data was an array of numbers
    case numberArray(data: [Double])

    /// The underlying data was an array of booleans
    case booleanArray(data: [Bool])

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
        } else if let dictionary = try? decoder.singleValueContainer().decode([String: Double].self) {
            self = .numberDictionary(data: dictionary)
            return
        } else if let dictionary = try? decoder.singleValueContainer().decode([String: Bool].self) {
            self = .booleanDictionary(data: dictionary)
            return
        } else if let stringArray = try? decoder.singleValueContainer().decode([String].self) {
            self = .array(data: stringArray)
            return
        } else if let numberArray = try? decoder.singleValueContainer().decode([Double].self) {
            self = .numberArray(data: numberArray)
            return
        } else if let boolArray = try? decoder.singleValueContainer().decode([Bool].self) {
            self = .booleanArray(data: boolArray)
            return
        } else if let string = try? decoder.singleValueContainer().decode(String.self) {
            self = .string(data: string)
            return
        } else if let bool = try? decoder.singleValueContainer().decode(Bool.self) {
            self = .bool(data: bool)
            return
        } else if let number = try? decoder.singleValueContainer().decode(Double.self) {
            self = .number(data: number)
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
        case .bool(let boolean):
            try container.encode(boolean)
        case .number(let number):
            try container.encode(number)
        case .array(let stringArray):
            try container.encode(stringArray)
        case .numberArray(let numberArray):
            try container.encode(numberArray)
        case .booleanArray(let booleanArray):
            try container.encode(booleanArray)
        case .dictionary(let dictionary):
            try container.encode(dictionary)
        case .numberDictionary(let dictionary):
            try container.encode(dictionary)
        case .booleanDictionary(let dictionary):
            try container.encode(dictionary)
        default:
            try container.encodeNil()
            return
        }
    }
}
