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
     
     This case uses recursive `AnyType` values to maintain `Sendable` conformance.

     - Note: This requires the decoder to add `AnyTypeDecodingContext` to the decoder's userInfo
     */
    case anyDictionary(data: [String: AnyType])

    /**
     The underlying data was an array of varied value types
     
     This case uses recursive `AnyType` values to maintain `Sendable` conformance.

     - Note: This requires the decoder to add `AnyTypeDecodingContext` to the decoder's userInfo
     */
    case anyArray(data: [AnyType])

    /// The underlying data was not in a known format. For example, it was a "null".
    case unknownData
}

// MARK: - Value Extraction

extension AnyType {
    /**
     Cast to expected type automatically.
     
     This method provides a convenient way to extract the underlying value and cast it to a specific type
     without explicit pattern matching on each case.
     
     - Parameter type: The target type to cast to
     - Returns: The value cast to the specified type, or `nil` if the cast fails
     
     - Example:
     ```swift
     let anyType = AnyType.string(data: "Hello")
     let title: String? = anyType.as(String.self)  // "Hello"
     
     // Usage with subscripts
     let dict = AnyType.anyDictionary(data: ["title": .string(data: "Hello")])
     let title: String? = dict["title"]?.as(String.self)
     ```
     */
    public func `as`<T>(_ type: T.Type) -> T? {
        switch self {
        case .string(let data):
            return data as? T
        case .bool(let data):
            return data as? T
        case .number(let data):
            return data as? T
        case .dictionary(let data):
            return data as? T
        case .numberDictionary(let data):
            return data as? T
        case .booleanDictionary(let data):
            return data as? T
        case .array(let data):
            return data as? T
        case .numberArray(let data):
            return data as? T
        case .booleanArray(let data):
            return data as? T
        case .anyDictionary(let data):
            return data as? T
        case .anyArray(let data):
            return data as? T
        case .unknownData:
            return nil
        }
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
        }
        
        // anyArray, anyDictionary, or "null" (which becomes unknownData)
        guard let context = decoder.userInfo[AnyTypeDecodingContext.key] as? AnyTypeDecodingContext else {
            throw AnyTypeDecodingError.missingDecodingContext
        }

        /* Handle mixed-type collections using the context. We could handle every case with this,
         but it would be slower because of the JSON serialization. So we only use this for anyArray
         and anyDictionary */
        self = try context.decode(path: decoder.codingPath)
    }
}

/// Custom CodingKey implementation for encoding anyDictionary cases with dynamic keys
struct CustomEncodable: CodingKey {
    var stringValue: String

    init?(stringValue: String) {
        self.stringValue = stringValue
    }

    var intValue: Int?

    // Required by CodingKey protocol but not used since anyArray uses unkeyedContainer
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
            for (key, value) in dictionary {
                if let codingKey = CustomEncodable(stringValue: key) {
                    try keyed.encode(value, forKey: codingKey)
                }
            }
        case .anyArray(data: let array):
            var indexed = encoder.unkeyedContainer()
            for value in array {
                try indexed.encode(value)
            }
        case .unknownData:
            try container.encodeNil()
        }
    }
}

/**
 Context for decoding mixed-type collections (anyDictionary and anyArray)

 This context turns serializes the data into JSON data to enable decoding of heterogeneous
 collections that cannot be directly decoded through Swift's standard Codable system.

 - Note: Required when decoding JSON containing mixed-type arrays or dictionaries
 */
public struct AnyTypeDecodingContext {
    static let key = CodingUserInfoKey(rawValue: "AnyTypeDecodingContext")!

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
            var result: [String: AnyType] = [:]
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
            var result: [AnyType] = []
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
            Attempted to decode data as an AnyType.anyArray, AnyType.anyDictionary, or AnyType.unknownData but `AnyTypeDecodingContext` is missing.
            Create a context with `let context = AnyTypeDecodingContext(rawData: data)`.
            Add the context to the decoder's userInfo by calling `context.inject(to: decoder)`.
            """
        }
    }
}
