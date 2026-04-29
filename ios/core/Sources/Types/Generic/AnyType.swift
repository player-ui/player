//
//  AnyType.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/17/20.
//

import Foundation

/// A union type to match the JS core players any type
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

    /// The underlying data was a dictionary of varied value types
    ///
    /// **This requires the decoder to add `AnyTypeDecodingContext` to the decoders userInfo**
    case anyDictionary(data: [String: Any])

    /// The underlying data was an array of varied value types
    ///
    /// **This requires the decoder to add `AnyTypeDecodingContext` to the decoders userInfo**
    case anyArray(data: [Any])

    /// The underlying data was not in a known format
    case unknownData

    // swiftlint:disable:next cyclomatic_complexity
    public func hash(into hasher: inout Hasher) {
        switch self {
        case let .string(data):
            hasher.combine(data)
        case let .bool(data):
            hasher.combine(data)
        case let .number(data):
            hasher.combine(data)
        case let .dictionary(data):
            hasher.combine(data)
        case let .numberDictionary(data):
            hasher.combine(data)
        case let .booleanDictionary(data):
            hasher.combine(data)
        case let .array(data):
            hasher.combine(data)
        case let .numberArray(data):
            hasher.combine(data)
        case let .booleanArray(data):
            hasher.combine(data)
        case let .anyDictionary(data):
            hasher.combine(data as NSDictionary)
        case let .anyArray(data):
            hasher.combine(data as NSArray)
        case .unknownData:
            return
        }
    }
}

extension AnyType: Equatable {
    // swiftlint:disable:next cyclomatic_complexity
    public static func == (lhs: AnyType, rhs: AnyType) -> Bool {
        switch (lhs, rhs) {
        case let (.string(lhv), .string(rhv)): return lhv == rhv
        case let (.bool(lhv), .bool(rhv)): return lhv == rhv
        case let (.number(lhv), .number(rhv)): return lhv == rhv
        case let (.dictionary(lhv), .dictionary(rhv)): return lhv == rhv
        case let (.numberDictionary(lhv), .numberDictionary(rhv)): return lhv == rhv
        case let (.booleanDictionary(lhv), .booleanDictionary(rhv)): return lhv == rhv
        case let (.array(lhv), .array(rhv)): return lhv == rhv
        case let (.numberArray(lhv), .numberArray(rhv)): return lhv == rhv
        case let (.booleanArray(lhv), .booleanArray(rhv)): return lhv == rhv
        case let (.anyDictionary(lhv), .anyDictionary(rhv)): return (lhv as NSDictionary)
            .isEqual(to: rhv)
        case let (.anyArray(lhv), .anyArray(rhv)): return (lhv as NSArray).isEqual(to: rhv)
        case (.unknownData, .unknownData): return true
        default: return false
        }
    }
}

/// Make AnyType Decodable
extension AnyType: Decodable {
    /// Construct AnyType by decoding
    /// - parameters:
    ///   - decoder: A decoder to decode from
    // swiftlint:disable:next cyclomatic_complexity
    public init(from decoder: Decoder) throws {
        if let dictionary = try? decoder.singleValueContainer().decode([String: String].self) {
            self = .dictionary(data: dictionary)
            return
        } else if let dictionary = try? decoder.singleValueContainer()
            .decode([String: Double].self) {
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
        } else if let context = decoder
            .userInfo[AnyTypeDecodingContext.key] as? AnyTypeDecodingContext {
            let obj = try context.objectFor(path: decoder.singleValueContainer().codingPath)
            if let dictionary = obj as? [String: Any] {
                self = .anyDictionary(data: dictionary)
                return
            } else if let array = obj as? [Any] {
                self = .anyArray(data: array)
                return
            }
        }
        self = .unknownData
    }
}

/// Custom CodingKey for dynamic key name
/// and to try to coerce `Any` into `Encodable`
struct CustomEncodable: CodingKey {
    var data: Encodable?
    var stringValue: String

    var intValue: Int?

    init(_ encodable: Any?, key: String) {
        stringValue = key
        if let encodable = encodable as? Encodable {
            data = encodable
        } else if
            let encodable,
            let data = try? JSONSerialization.data(
                withJSONObject: encodable,
                options: .fragmentsAllowed
            ),
            let decoded = try? AnyTypeDecodingContext(rawData: data)
            .inject(to: JSONDecoder())
            .decode(
                AnyType.self,
                from: data
            ) {
            self.data = decoded
        }
    }

    init?(stringValue _: String) {
        nil
    }

    init?(intValue _: Int) {
        nil
    }
}

/// Make AnyType Encodable
extension AnyType: Encodable {
    /// Encode to an encoder
    /// - parameters:
    ///   - encoder: The encoder to encode the value to
    // swiftlint:disable:next cyclomatic_complexity
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case let .string(string):
            try container.encode(string)
        case let .bool(boolean):
            try container.encode(boolean)
        case let .number(number):
            try container.encode(number)
        case let .array(stringArray):
            try container.encode(stringArray)
        case let .numberArray(numberArray):
            try container.encode(numberArray)
        case let .booleanArray(booleanArray):
            try container.encode(booleanArray)
        case let .dictionary(dictionary):
            try container.encode(dictionary)
        case let .numberDictionary(dictionary):
            try container.encode(dictionary)
        case let .booleanDictionary(dictionary):
            try container.encode(dictionary)
        case let .anyDictionary(data: dictionary):
            var keyed = encoder.container(keyedBy: CustomEncodable.self)
            for key in dictionary.keys {
                let customEncodable = CustomEncodable(dictionary[key], key: key)
                if let value = customEncodable.data {
                    try keyed.encode(value, forKey: customEncodable)
                }
            }
        case let .anyArray(data: array):
            var indexed = encoder.unkeyedContainer()
            for value in array {
                let encodable = CustomEncodable(value, key: "")
                if let data = encodable.data {
                    try indexed.encode(data)
                }
            }
        default:
            try container.encodeNil()
            return
        }
    }
}

public struct AnyTypeDecodingContext {
    // swiftlint:disable:next force_unwrapping
    static let key: CodingUserInfoKey = .init(rawValue: "AnyTypeDecodingContext")!

    public var rawData: Data

    public init(rawData: Data) {
        self.rawData = rawData
    }

    public func objectFor(path: [CodingKey]) throws -> Any {
        let jsonData = try JSONSerialization.jsonObject(with: rawData)
        return traverse(path: path, in: jsonData)
    }

    public func inject(to decoder: JSONDecoder) -> JSONDecoder {
        decoder.userInfo[AnyTypeDecodingContext.key] = self
        return decoder
    }

    private func traverse(path: [CodingKey], in obj: Any) -> Any {
        path.reduce(obj) { partialResult, key in
            if let index = key.intValue {
                return (partialResult as? [Any])?[index] as Any
            }
            return (partialResult as? [String: Any])?[key.stringValue] as Any
        }
    }
}
