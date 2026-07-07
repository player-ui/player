//
//  AnyType.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/17/20.
//

import Foundation

// swiftlint:disable file_length

/// A union type to match the JS core players any type
///
/// This type is `Sendable` and uses recursive cases for complex types.
public enum AnyType: Hashable, Sendable {
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
    /// This case uses recursive `AnyType` values to maintain `Sendable` conformance.
    ///
    /// - Note: This requires the decoder to add `AnyTypeDecodingContext` to the decoder's userInfo
    case anyDictionary(data: [String: AnyType])

    /// The underlying data was an array of varied value types
    ///
    /// This case uses recursive `AnyType` values to maintain `Sendable` conformance.
    ///
    /// - Note: This requires the decoder to add `AnyTypeDecodingContext` to the decoder's userInfo
    case anyArray(data: [AnyType])

    /// The underlying data was not in a known format. For example, it was a "null".
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
            // Hash the dictionary by combining sorted keys and their values
            for key in data.keys.sorted() {
                hasher.combine(key)
                hasher.combine(data[key])
            }
        case let .anyArray(data):
            hasher.combine(data)
        case .unknownData:
            return
        }
    }
}

// MARK: - Value Extraction

public extension AnyType {
    /// Cast to expected type automatically.
    ///
    /// This method provides a convenient way to extract the underlying value and cast it to a
    /// specific type
    /// without explicit pattern matching on each case.
    ///
    /// - Parameter type: The target type to cast to
    /// - Returns: The value cast to the specified type, or `nil` if the cast fails
    ///
    /// - Example:
    /// ```swift
    /// let anyType = AnyType.string(data: "Hello")
    /// let title: String? = anyType.as(String.self)  // "Hello"
    ///
    /// // Usage with subscripts
    /// let dict = AnyType.anyDictionary(data: ["title": .string(data: "Hello")])
    /// let title: String? = dict["title"]?.as(String.self)
    /// ```
    // swiftlint:disable:next cyclomatic_complexity
    func `as`<T>(_: T.Type) -> T? {
        switch self {
        case let .string(data):
            return data as? T
        case let .bool(data):
            return data as? T
        case let .number(data):
            return data as? T
        case let .dictionary(data):
            return data as? T
        case let .numberDictionary(data):
            return data as? T
        case let .booleanDictionary(data):
            return data as? T
        case let .array(data):
            return data as? T
        case let .numberArray(data):
            return data as? T
        case let .booleanArray(data):
            return data as? T
        case let .anyDictionary(data):
            return data as? T
        case let .anyArray(data):
            return data as? T
        case .unknownData:
            return nil
        }
    }

    /// Subscript access for dictionary-like `AnyType` values.
    ///
    /// Provides convenient access to values in `anyDictionary`, `dictionary`, `numberDictionary`,
    /// and `booleanDictionary` cases.
    ///
    /// - Parameter key: The key to look up
    /// - Returns: The value associated with the key, or `nil` if the key doesn't exist
    ///          or if this is not a dictionary-like case
    ///
    /// - Example:
    /// ```swift
    /// let dict = AnyType.anyDictionary(data: ["title": .string(data: "Hello")])
    /// let title: String? = dict["title"]?.as(String.self)
    /// ```
    subscript(key: String) -> AnyType? {
        switch self {
        case let .dictionary(data):
            return data[key].map { .string(data: $0) }
        case let .numberDictionary(data):
            return data[key].map { .number(data: $0) }
        case let .booleanDictionary(data):
            return data[key].map { .bool(data: $0) }
        case let .anyDictionary(data):
            return data[key]
        default:
            return nil
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
        case let (.anyDictionary(lhv), .anyDictionary(rhv)): return lhv == rhv
        case let (.anyArray(lhv), .anyArray(rhv)): return lhv == rhv
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
        }

        // anyArray, anyDictionary, or "null" (which becomes unknownData)
        guard let context = decoder.userInfo[AnyTypeDecodingContext.key] as? AnyTypeDecodingContext
        else {
            throw AnyTypeDecodingError.missingDecodingContext
        }

        // Handle mixed-type collections using the context. We could handle every case with this,
        // but it would be slower because of the JSON serialization. So we only use this for
        // anyArray
        // and anyDictionary
        self = try context.decode(path: decoder.codingPath)
    }
}

/// Custom CodingKey implementation for encoding anyDictionary cases with dynamic keys
struct CustomEncodable: CodingKey {
    var stringValue: String

    var intValue: Int?

    init?(stringValue: String) {
        self.stringValue = stringValue
    }

    /// Required by CodingKey protocol but not used since anyArray uses unkeyedContainer
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
            for (key, value) in dictionary {
                if let codingKey = CustomEncodable(stringValue: key) {
                    try keyed.encode(value, forKey: codingKey)
                }
            }
        case let .anyArray(data: array):
            var indexed = encoder.unkeyedContainer()
            for value in array {
                try indexed.encode(value)
            }
        case .unknownData:
            try container.encodeNil()
        }
    }
}

/// Context for decoding mixed-type collections (anyDictionary and anyArray)
///
/// This context turns serializes the data into JSON data to enable decoding of heterogeneous
/// collections that cannot be directly decoded through Swift's standard Codable system.
///
/// - Note: Required when decoding JSON containing mixed-type arrays or dictionaries
public struct AnyTypeDecodingContext {
    static let key: CodingUserInfoKey! = CodingUserInfoKey(rawValue: "AnyTypeDecodingContext")

    private var rawData: Data

    public init(rawData: Data) {
        self.rawData = rawData
    }

    /// Injects this context into a JSONDecoder's userInfo for use during decoding
    public func inject(to decoder: JSONDecoder) -> JSONDecoder {
        decoder.userInfo[AnyTypeDecodingContext.key] = self
        return decoder
    }

    /// Decodes the raw JSON data at the given coding path to AnyType
    func decode(path: [CodingKey]) throws -> AnyType {
        let obj = try objectFor(path: path)
        return Self.decode(from: obj)
    }

    /// Retrieves the object at the given coding path from the raw JSON data
    private func objectFor(path: [CodingKey]) throws -> Any {
        let jsonData = try JSONSerialization.jsonObject(with: rawData)
        return traverse(path: path, in: jsonData)
    }

    /// Traverses the JSON object tree following the coding path
    private func traverse(path: [CodingKey], in obj: Any) -> Any {
        path.reduce(obj) { partialResult, key in
            if let index = key.intValue {
                return (partialResult as? [Any])?[index] as Any
            }
            return (partialResult as? [String: Any])?[key.stringValue] as Any
        }
    }

    /// Decodes a raw JSON object to AnyType
    // swiftlint:disable:next cyclomatic_complexity
    private static func decode(from value: Any) -> AnyType {
        // Handle primitives
        if let string = value as? String {
            return .string(data: string)
        } else if let bool = value as? Bool {
            return .bool(data: bool)
        } else if let number = value as? Double {
            return .number(data: number)
        } else if let number = value as? Int {
            return .number(data: Double(number))
        } else if let dict = value as? [String: Any] {
            // Check if it's a homogeneous dictionary first (better performance)
            if let stringDict = dict as? [String: String] {
                return .dictionary(data: stringDict)
            } else if let numberDict = dict as? [String: Double] {
                return .numberDictionary(data: numberDict)
            } else if let boolDict = dict as? [String: Bool] {
                return .booleanDictionary(data: boolDict)
            }
            // Mixed dictionary - recurse
            var result = [String: AnyType]()
            for (key, val) in dict {
                result[key] = decode(from: val)
            }
            return .anyDictionary(data: result)
        } else if let array = value as? [Any] {
            // Check if it's a homogeneous array first (better performance)
            if let stringArray = array as? [String] {
                return .array(data: stringArray)
            } else if let numberArray = array as? [Double] {
                return .numberArray(data: numberArray)
            } else if let boolArray = array as? [Bool] {
                return .booleanArray(data: boolArray)
            }
            // Mixed array - recurse
            var result = [AnyType]()
            for val in array {
                result.append(decode(from: val))
            }
            return .anyArray(data: result)
        }
        return .unknownData
    }
}

public enum AnyTypeDecodingError: Error {
    case missingDecodingContext

    public var localizedDescription: String {
        switch self {
        case .missingDecodingContext:
            return """
            Attempted to decode data as an AnyType.anyArray, AnyType.anyDictionary, or \
            AnyType.unknownData but `AnyTypeDecodingContext` is missing.
            Create a context with `let context = AnyTypeDecodingContext(rawData: data)`.
            Add the context to the decoder's userInfo by calling `context.inject(to: decoder)`.
            """
        }
    }
}
