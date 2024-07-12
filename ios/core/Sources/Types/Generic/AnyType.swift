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
    // swiftlint:disable cyclomatic_complexity
    public func hash(into hasher: inout Hasher) {
        switch self {
        case .string(let data):
            hasher.combine(data)
        case .bool(let data):
            hasher.combine(data)
        case .number(let data):
            hasher.combine(data)
        case .dictionary(let data):
            hasher.combine(data)
        case .numberDictionary(let data):
            hasher.combine(data)
        case .booleanDictionary(let data):
            hasher.combine(data)
        case .array(let data):
            hasher.combine(data)
        case .numberArray(let data):
            hasher.combine(data)
        case .booleanArray(let data):
            hasher.combine(data)
        case .anyDictionary(let data):
            hasher.combine(data as NSDictionary)
        case .unknownData:
            return
        }
    }

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

    /**
     The underlying data was a dictionary of varied value types

     **This requires the decoder to add `AnyTypeDecodingContext` to the decoders userInfo**
     */
    case anyDictionary(data: [String: Any])

    /// The underlying data was not in a known format
    case unknownData
}

extension AnyType: Equatable {
    // swiftlint:disable cyclomatic_complexity
    public static func == (lhs: AnyType, rhs: AnyType) -> Bool {
        switch (lhs, rhs) {
        case (.string(let lhv), .string(let rhv)): return lhv == rhv
        case (.bool(let lhv), .bool(let rhv)): return lhv == rhv
        case (.number(let lhv), .number(let rhv)): return lhv == rhv
        case (.dictionary(let lhv), .dictionary(let rhv)): return lhv == rhv
        case (.numberDictionary(let lhv), .numberDictionary(let rhv)): return lhv == rhv
        case (.booleanDictionary(let lhv), .booleanDictionary(let rhv)): return lhv == rhv
        case (.array(let lhv), .array(let rhv)): return lhv == rhv
        case (.numberArray(let lhv), .numberArray(let rhv)): return lhv == rhv
        case (.booleanArray(let lhv), .booleanArray(let rhv)): return lhv == rhv
        case (.anyDictionary(let lhv), .anyDictionary(let rhv)): return (lhv as NSDictionary).isEqual(to: rhv)
        default: return false
        }
    }
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
    // swiftlint:disable cyclomatic_complexity
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
        } else if let context = decoder.userInfo[AnyTypeDecodingContext.key] as? AnyTypeDecodingContext {
            let obj = try context.objectFor(path: decoder.singleValueContainer().codingPath)
            if let dictionary = obj as? [String: Any] {
                self = .anyDictionary(data: dictionary)
                return
            }
        }
        self = .unknownData
        return
    }
}

// Custom CodingKey for dynamic key name
// and to try to coerce `Any` into `Encodable`
struct CustomEncodable: CodingKey {
    var data: Encodable?
    init(_ encodable: Any?, key: String) {
        self.stringValue = key
        if let encodable = encodable as? Encodable {
            self.data = encodable
        }
    }
    var stringValue: String

    init?(stringValue: String) {
        return nil
    }

    var intValue: Int?

    init?(intValue: Int) {
        return nil
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
        case .anyDictionary(data: let dictionary):
            var keyed = encoder.container(keyedBy: CustomEncodable.self)
            for key in dictionary.keys {
                let customEncodable = CustomEncodable(dictionary[key], key: key)
                if let value = customEncodable.data {
                    try keyed.encode(value, forKey: customEncodable)
                }
            }
        default:
            try container.encodeNil()
            return
        }
    }
}

public struct AnyTypeDecodingContext {
    static let key = CodingUserInfoKey(rawValue: "AnyTypeDecodingContext")!

    public var rawData: Data

    public init(rawData: Data) {
        self.rawData = rawData
    }

    public func objectFor(path: [CodingKey]) throws -> Any {
        let jsonData = try JSONSerialization.jsonObject(with: rawData)
        return traverse(path: path, in: jsonData)
    }

    private func traverse(path: [CodingKey], in obj: Any) -> Any {
        path.reduce(obj) { partialResult, key in
            if let index = key.intValue {
                return (partialResult as? [Any])?[index] as Any
            }
            return (partialResult as? [String: Any])?[key.stringValue] as Any
        }
    }

    public func inject(to decoder: JSONDecoder) -> JSONDecoder {
        decoder.userInfo[AnyTypeDecodingContext.key] = self
        return decoder
    }
}
