//
//  AnyType.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/17/20.
//

import Foundation

/**
 A union type to match the JS core players any type
 
 This type is `Sendable` and uses recursive cases for complex types.
 */
public enum AnyType: Hashable, Sendable {
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
            // Hash the dictionary by combining sorted keys and their values
            for key in data.keys.sorted() {
                hasher.combine(key)
                hasher.combine(data[key])
            }
        case .anyArray(let data):
            hasher.combine(data)
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
     
     - Note: This case now uses recursive `AnyType` values instead of `Any` to maintain `Sendable` conformance.
     Use the `asAnyDictionary` property for backward compatibility with `[String: Any]`.
     */
    case anyDictionary(data: [String: AnyType])

    /**
     The underlying data was an array of varied value types

     **This requires the decoder to add `AnyTypeDecodingContext` to the decoders userInfo**
     
     - Note: This case now uses recursive `AnyType` values instead of `Any` to maintain `Sendable` conformance.
     Use the `asAnyArray` property for backward compatibility with `[Any]`.
     */
    case anyArray(data: [AnyType])

    /// The underlying data was not in a known format
    case unknownData
}

// MARK: - Backward Compatibility & Conversion Helpers

extension AnyType {
    /**
     Create an AnyType from a legacy `[String: Any]` dictionary.
     
     This initializer recursively converts the dictionary values to AnyType.
     - Parameter anyDictionary: A dictionary with Any values
     */
    public init(anyDictionary: [String: Any]) {
        let converted = anyDictionary.mapValues { value -> AnyType in
            AnyType(from: value)
        }
        self = .anyDictionary(data: converted)
    }
    
    /**
     Create an AnyType from a legacy `[Any]` array.
     
     This initializer recursively converts the array elements to AnyType.
     - Parameter anyArray: An array with Any elements
     */
    public init(anyArray: [Any]) {
        let converted = anyArray.map { value -> AnyType in
            AnyType(from: value)
        }
        self = .anyArray(data: converted)
    }
    
    /**
     Convert an `Any` value to AnyType.
     
     This method attempts to match the value to the most specific AnyType case.
     - Parameter value: The value to convert
     */
    public init(from value: Any) {
        switch value {
        case let str as String:
            self = .string(data: str)
        case let bool as Bool:
            self = .bool(data: bool)
        case let num as NSNumber:
            // NSNumber from JSONSerialization - check if it's actually a bool
            if CFNumberGetType(num as CFNumber) == .charType {
                // This is actually a boolean
                self = .bool(data: num.boolValue)
            } else {
                self = .number(data: num.doubleValue)
            }
        case let num as Double:
            self = .number(data: num)
        case let num as Int:
            self = .number(data: Double(num))
        case let num as Float:
            self = .number(data: Double(num))
        case let dict as [String: String]:
            self = .dictionary(data: dict)
        case let dict as [String: Double]:
            self = .numberDictionary(data: dict)
        case let dict as [String: Bool]:
            self = .booleanDictionary(data: dict)
        case let dict as [String: Any]:
            self = .init(anyDictionary: dict)
        case let arr as [String]:
            self = .array(data: arr)
        case let arr as [Double]:
            self = .numberArray(data: arr)
        case let arr as [Bool]:
            self = .booleanArray(data: arr)
        case let arr as [Any]:
            self = .init(anyArray: arr)
        default:
            self = .unknownData
        }
    }
    
    /**
     Access the anyDictionary case as `[String: Any]` for backward compatibility.
     
     - Returns: The dictionary as `[String: Any]`, or `nil` if not an anyDictionary case.
     */
    public var asAnyDictionary: [String: Any]? {
        guard case .anyDictionary(let data) = self else { return nil }
        return data.mapValues { $0.asAny }
    }
    
    /**
     Access the anyArray case as `[Any]` for backward compatibility.
     
     - Returns: The array as `[Any]`, or `nil` if not an anyArray case.
     */
    public var asAnyArray: [Any]? {
        guard case .anyArray(let data) = self else { return nil }
        return data.map { $0.asAny }
    }
    
    /**
     Convert this AnyType back to an `Any` value.
     
     This is useful for interoperating with APIs that expect `Any`.
     */
    public var asAny: Any {
        switch self {
        case .string(let data): return data
        case .bool(let data): return data
        case .number(let data): return data
        case .dictionary(let data): return data
        case .numberDictionary(let data): return data
        case .booleanDictionary(let data): return data
        case .array(let data): return data
        case .numberArray(let data): return data
        case .booleanArray(let data): return data
        case .anyDictionary(let data): return data.mapValues { $0.asAny }
        case .anyArray(let data): return data.map { $0.asAny }
        case .unknownData: return NSNull()
        }
    }
    
}

// MARK: - Reflection Support

extension AnyType {
    /**
     Cast to expected type automatically.
     
     This method provides a convenient way to cast the underlying value to a specific type
     without explicit pattern matching or type checking.
     
     - Parameter type: The target type to cast to
     - Returns: The value cast to the specified type, or `nil` if the cast fails
     
     - Example:
     ```swift
     let anyType = AnyType.string(data: "Hello")
     let title: String? = anyType.as(String.self)  // "Hello"
     
     // Usage in dictionaries
     let envelope: AnyType = // ... some AnyType
     let title: String? = envelope["title"]?.as(String.self)
     ```
     */
    public func `as`<T>(_ type: T.Type) -> T? {
        return asAny as? T
    }
    
    /**
     Subscript access for dictionary-like `AnyType` values.
     
     Provides convenient access to values in `anyDictionary`, `dictionary`, `numberDictionary`,
     and `booleanDictionary` cases.
     
     - Parameter key: The key to look up
     - Returns: The value associated with the key, or `nil` if the key doesn't exist
               or if this is not a dictionary-like case
     
     - Example:
     ```swift
     let dict = AnyType.anyDictionary(data: ["title": .string(data: "Hello")])
     let title: String? = dict["title"]?.as(String.self)
     ```
     */
    public subscript(key: String) -> AnyType? {
        switch self {
        case .dictionary(let data):
            return data[key].map { .string(data: $0) }
        case .numberDictionary(let data):
            return data[key].map { .number(data: $0) }
        case .booleanDictionary(let data):
            return data[key].map { .bool(data: $0) }
        case .anyDictionary(let data):
            return data[key]
        default:
            return nil
        }
    }
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
        case (.anyDictionary(let lhv), .anyDictionary(let rhv)): return lhv == rhv
        case (.anyArray(let lhv), .anyArray(let rhv)): return lhv == rhv
        case (.unknownData, .unknownData): return true
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
                // Convert [String: Any] to [String: AnyType] recursively
                self = AnyType(anyDictionary: dictionary)
                return
            } else if let array = obj as? [Any] {
                // Convert [Any] to [AnyType] recursively
                self = AnyType(anyArray: array)
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
        } else if
            let encodable,
            let data = try? JSONSerialization.data(withJSONObject: encodable, options: .fragmentsAllowed),
            let decoded = try? AnyTypeDecodingContext(rawData: data).inject(to: JSONDecoder()).decode(AnyType.self, from: data)
        {
            self.data = decoded
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
                let customEncodable = CustomEncodable(dictionary[key]?.asAny, key: key)
                if let value = customEncodable.data {
                    try keyed.encode(value, forKey: customEncodable)
                }
            }
        case .anyArray(data: let array):
            var indexed = encoder.unkeyedContainer()
            for value in array {
                let encodable = CustomEncodable(value.asAny, key: "")
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
