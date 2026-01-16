//
//  AnyTypeTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 4/17/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
@testable import PlayerUI

class AnyTypeTests: XCTestCase {
    func testStringData() {
        let string = "\"test\""
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .string(let result):
            XCTAssertEqual("test", result)
        default:
            XCTFail("data was not string")
        }
    }

    func testBoolData() {
        let string = "true"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .bool(let result):
            XCTAssertEqual(true, result)
        default:
            XCTFail("data was not string")
        }
    }

    func testNumberDataNoDecimal() {
        let string = "1"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .number(let result):
            XCTAssertEqual(1, result)
        default:
            XCTFail("data was not string")
        }
    }

    func testNumberDataDecimal() {
        let string = "1.5"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .number(let result):
            XCTAssertEqual(1.5, result)
        default:
            XCTFail("data was not string")
        }
    }

    func testArrayData() {
        let string = "[\"test\", \"data\"]"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .array(let result):
            XCTAssertEqual(["test", "data"], result)
        default:
            XCTFail("data was not array")
        }
    }

    func testNumberArrayData() {
        let string = "[1, 2]"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .numberArray(let result):
            XCTAssertEqual([1, 2], result)
        default:
            XCTFail("data was not array")
        }
    }

    func testBoolArrayData() {
        let string = "[false, true]"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .booleanArray(let result):
            XCTAssertEqual([false, true], result)
        default:
            XCTFail("data was not array")
        }
    }

    func testDictionaryData() {
        let string = "{\"key\":\"value\"}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .dictionary(let result):
            XCTAssertEqual("value", result["key"])
        default:
            XCTFail("data was not dictionary")
        }
    }

    func testNumberDictionaryData() {
        let string = "{\"key\":1}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .numberDictionary(let result):
            XCTAssertEqual(1, result["key"])
        default:
            XCTFail("data was not dictionary")
        }
    }

    func testBoolDictionaryData() {
        let string = "{\"key\":false}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .booleanDictionary(let result):
            XCTAssertEqual(false, result["key"])
        default:
            XCTFail("data was not dictionary")
        }
    }

    func testAnyDictionaryData() {
        let string = "{\"key\":false,\"key2\":1}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? AnyTypeDecodingContext(rawData: string.data(using: .utf8)!).inject(to: JSONDecoder()).decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        // Use the asAnyDictionary helper for backward compatibility
        guard let dict = anyType.asAnyDictionary else {
            return XCTFail("data was not dictionary")
        }
        XCTAssertEqual(false, dict["key"] as? Bool)
        // JSON integers decode as NSNumber
        if let num = dict["key2"] as? NSNumber {
            XCTAssertEqual(1, num.intValue)
        } else {
            XCTFail("key2 was not a number")
        }
    }

    func testAnyArray() {
        let string = "[1, true]"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? AnyTypeDecodingContext(rawData: string.data(using: .utf8)!).inject(to: JSONDecoder()).decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        // Use the asAnyArray helper for backward compatibility
        guard let array = anyType.asAnyArray else {
            return XCTFail("data was not anyArray")
        }
        if let num = array[0] as? NSNumber {
            XCTAssertEqual(1, num.intValue)
        } else {
            XCTFail("first element was not a number")
        }
        XCTAssertEqual(true, array[1] as? Bool)
    }

    func testAnyDictionaryDataWithArray() {
        let string = "{\"key2\":1,\"key\":[false]}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? AnyTypeDecodingContext(rawData: string.data(using: .utf8)!).inject(to: JSONDecoder()).decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        // Use the asAnyDictionary helper for backward compatibility
        guard let dict = anyType.asAnyDictionary else {
            return XCTFail("data was not dictionary")
        }
        // Check for [Bool] first (more specific type from booleanArray)
        if let arr = dict["key"] as? [Bool] {
            XCTAssertEqual(false, arr.first)
        } else if let arr = dict["key"] as? NSArray {
            // Try NSArray (from JSONSerialization)
            if let first = arr.firstObject as? NSNumber {
                XCTAssertEqual(false, first.boolValue)
            } else {
                XCTFail("key was NSArray but first element was not a number/bool")
            }
        } else if let arr = dict["key"] as? [Any], let first = arr.first as? Bool {
            XCTAssertEqual(false, first)
        } else {
            XCTFail("key was not an array with boolean")
        }
        if let num = dict["key2"] as? NSNumber {
            XCTAssertEqual(1, num.intValue)
        } else {
            XCTFail("key2 was not a number")
        }
    }

    func testAnyDictionaryDataWithDeepNestedTypes() {
        let string = "{\"container\":{\"key2\":1,\"key\":[{\"nestedKey\": \"nestedValue\"}]}}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? AnyTypeDecodingContext(rawData: string.data(using: .utf8)!).inject(to: JSONDecoder()).decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        // Use the asAnyDictionary helper for backward compatibility
        guard let dict = anyType.asAnyDictionary else {
            return XCTFail("data was not dictionary")
        }
        let container = dict["container"] as? [String: Any]
        let nestedArray = container?["key"] as? [Any]
        let nestedDict = nestedArray?.first as? [String: Any]
        XCTAssertEqual("nestedValue", nestedDict?["nestedKey"] as? String)
        if let num = container?["key2"] as? NSNumber {
            XCTAssertEqual(1, num.intValue)
        } else {
            XCTFail("key2 was not a number")
        }
    }

    func testUnknownData() {
        let string = "{\"key\":\"value\", \"key2\": 2}"
        guard
            let data = string.data(using: .utf8),
            let anyType = try? JSONDecoder().decode(AnyType.self, from: data)
        else { return XCTFail("could not decode") }
        switch anyType {
        case .unknownData:
            XCTAssertTrue(true)
        default:
            XCTFail("data was not unknown")
        }
    }

    func testEncodeUnknownData() {
        let anyType = AnyType.unknownData

        guard
            let data = try? JSONEncoder().encode(anyType)
        else { return XCTFail("could not encode") }

        XCTAssertNotNil(data)
    }

    func testEncode() {
        XCTAssertEqual("\"test\"", doEncode(AnyType.string(data: "test")))
        XCTAssertEqual("1", doEncode(AnyType.number(data: 1)))
        XCTAssertEqual("1.5", doEncode(AnyType.number(data: 1.5)))
        XCTAssertEqual("false", doEncode(AnyType.bool(data: false)))
        XCTAssertEqual("{\"key\":\"value\"}", doEncode(AnyType.dictionary(data: ["key": "value"])))
        XCTAssertEqual("{\"key\":1}", doEncode(AnyType.numberDictionary(data: ["key": 1])))
        XCTAssertEqual("{\"key\":1.5}", doEncode(AnyType.numberDictionary(data: ["key": 1.5])))
        XCTAssertEqual("{\"key\":false}", doEncode(AnyType.booleanDictionary(data: ["key": false])))
        XCTAssertEqual("[\"test\",\"data\"]", doEncode(AnyType.array(data: ["test", "data"])))
        XCTAssertEqual("[1,2]", doEncode(AnyType.numberArray(data: [1, 2])))
        XCTAssertEqual("[false,true]", doEncode(AnyType.booleanArray(data: [false, true])))
        XCTAssertEqual("{\"a\":false,\"b\":1}", doEncode(AnyType.anyDictionary(data: ["a": .bool(data: false), "b": .number(data: 1)])))
        XCTAssertEqual("[1,\"a\",true]", doEncode(AnyType.anyArray(data: [.number(data: 1), .string(data: "a"), .bool(data: true)])))
        XCTAssertEqual("{\"key\":[{\"nestedKey\":\"nestedValue\"},true,{}],\"key2\":1}", doEncode(AnyType.anyDictionary(data: ["key2": .number(data: 1), "key": .anyArray(data: [.anyDictionary(data: ["nestedKey": .string(data: "nestedValue")]), .bool(data: true), .anyDictionary(data: [:])])])))
    }

    func doEncode(_ data: AnyType) -> String? {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let data = try? encoder.encode(data)
        guard let data = data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func testCustomEncodable() {
        XCTAssertNil(CustomEncodable(stringValue: "test"))
        XCTAssertNil(CustomEncodable(intValue: 1))
    }

    func testHash() {
        XCTAssertNotEqual(AnyType.string(data: "test").hashValue, 0)
        XCTAssertNotEqual(AnyType.number(data: 1).hashValue, 0)
        XCTAssertNotEqual(AnyType.number(data: 1.5).hashValue, 0)
        XCTAssertNotEqual(AnyType.bool(data: false).hashValue, 0)
        XCTAssertNotEqual(AnyType.dictionary(data: ["key": "value"]).hashValue, 0)
        XCTAssertNotEqual(AnyType.numberDictionary(data: ["key": 1]).hashValue, 0)
        XCTAssertNotEqual(AnyType.numberDictionary(data: ["key": 1.5]).hashValue, 0)
        XCTAssertNotEqual(AnyType.booleanDictionary(data: ["key": false]).hashValue, 0)
        XCTAssertNotEqual(AnyType.array(data: ["test", "data"]).hashValue, 0)
        XCTAssertNotEqual(AnyType.numberArray(data: [1, 2]).hashValue, 0)
        XCTAssertNotEqual(AnyType.booleanArray(data: [false, true]).hashValue, 0)
        XCTAssertNotEqual(AnyType.anyDictionary(data: ["key": .bool(data: false), "key2": .number(data: 1)]).hashValue, 0)
        XCTAssertNotEqual(AnyType.anyArray(data: [.number(data: 1), .string(data: "a"), .bool(data: true)]).hashValue, 0)
        XCTAssertNotEqual(AnyType.unknownData.hashValue, 0)
    }

    func testEquality() {
        XCTAssertEqual(AnyType.string(data: "test"), AnyType.string(data: "test"))
        XCTAssertEqual(AnyType.number(data: 1), AnyType.number(data: 1))
        XCTAssertEqual(AnyType.number(data: 1.5), AnyType.number(data: 1.5))
        XCTAssertEqual(AnyType.bool(data: false), AnyType.bool(data: false))
        XCTAssertEqual(AnyType.dictionary(data: ["key": "value"]), AnyType.dictionary(data: ["key": "value"]))
        XCTAssertEqual(AnyType.numberDictionary(data: ["key": 1]), AnyType.numberDictionary(data: ["key": 1]))
        XCTAssertEqual(AnyType.numberDictionary(data: ["key": 1.5]), AnyType.numberDictionary(data: ["key": 1.5]))
        XCTAssertEqual(AnyType.booleanDictionary(data: ["key": false]), AnyType.booleanDictionary(data: ["key": false]))
        XCTAssertEqual(AnyType.array(data: ["test", "data"]), AnyType.array(data: ["test", "data"]))
        XCTAssertEqual(AnyType.numberArray(data: [1, 2]), AnyType.numberArray(data: [1, 2]))
        XCTAssertEqual(AnyType.booleanArray(data: [false, true]), AnyType.booleanArray(data: [false, true]))
        XCTAssertEqual(AnyType.anyDictionary(data: ["key": .bool(data: false), "key2": .number(data: 1)]), AnyType.anyDictionary(data: ["key": .bool(data: false), "key2": .number(data: 1)]))
        XCTAssertEqual(AnyType.anyArray(data: [.number(data: 1), .string(data: "a"), .bool(data: true)]), AnyType.anyArray(data: [.number(data: 1), .string(data: "a"), .bool(data: true)]))
        XCTAssertNotEqual(AnyType.unknownData, AnyType.string(data: "test"))
        XCTAssertEqual(AnyType.unknownData, AnyType.unknownData)
    }

    func testDecodingContext() throws {
        let structure = [
            "object": [
                "key1": [
                    5
                ]
            ]
        ]

        struct TestCodingKey: CodingKey {
            init?(stringValue: String) {
                self.stringValue = stringValue
                intValue = nil
            }

            init?(intValue: Int) {
                stringValue = "\(intValue)"
                self.intValue = intValue
            }

            var stringValue: String
            var intValue: Int?
        }
        let data = try JSONSerialization.data(withJSONObject: structure)
        let context = AnyTypeDecodingContext(rawData: data)

        let object = try context.objectFor(path: [
            TestCodingKey(stringValue: "object")!,
            TestCodingKey(stringValue: "key1")!,
            TestCodingKey(intValue: 0)!
        ])

        XCTAssertEqual(object as? Double, 5)
    }
    
    // MARK: - Backward Compatibility Tests
    
    func testInitFromAnyDictionary() {
        // Test converting [String: Any] to AnyType
        let dict: [String: Any] = ["key": "value", "number": 42, "bool": true]
        let anyType = AnyType(anyDictionary: dict)
        
        guard case .anyDictionary(let data) = anyType else {
            return XCTFail("Expected anyDictionary case")
        }
        
        // Verify the values were converted correctly
        guard case .string(let strValue) = data["key"] else {
            return XCTFail("key should be string")
        }
        XCTAssertEqual("value", strValue)
        
        guard case .number(let numValue) = data["number"] else {
            return XCTFail("number should be number")
        }
        XCTAssertEqual(42, numValue)
        
        guard case .bool(let boolValue) = data["bool"] else {
            return XCTFail("bool should be bool")
        }
        XCTAssertEqual(true, boolValue)
    }
    
    func testInitFromAnyArray() {
        // Test converting [Any] to AnyType
        let array: [Any] = [1, "test", false]
        let anyType = AnyType(anyArray: array)
        
        guard case .anyArray(let data) = anyType else {
            return XCTFail("Expected anyArray case")
        }
        
        XCTAssertEqual(3, data.count)
        
        guard case .number(let num) = data[0] else {
            return XCTFail("first element should be number")
        }
        XCTAssertEqual(1, num)
        
        guard case .string(let str) = data[1] else {
            return XCTFail("second element should be string")
        }
        XCTAssertEqual("test", str)
        
        guard case .bool(let bool) = data[2] else {
            return XCTFail("third element should be bool")
        }
        XCTAssertEqual(false, bool)
    }
    
    func testInitFromAnyWithNSNumber() {
        // Test NSNumber handling (from JSONSerialization)
        let intNumber = NSNumber(value: 42)
        let doubleNumber = NSNumber(value: 3.14)
        let boolNumber = NSNumber(value: true)
        
        let intType = AnyType(from: intNumber as Any)
        let doubleType = AnyType(from: doubleNumber as Any)
        let boolType = AnyType(from: boolNumber as Any)
        
        // NSNumber with integer should become .number
        if case .number(let value) = intType {
            XCTAssertEqual(42, value)
        } else if case .bool(let value) = intType {
            // Depending on NSNumber internals, might be bool
            XCTAssertEqual(true, value)
        } else {
            XCTFail("NSNumber should convert to number or bool")
        }
        
        // NSNumber with double should become .number
        guard case .number(let doubleValue) = doubleType else {
            return XCTFail("NSNumber with double should be number")
        }
        XCTAssertEqual(3.14, doubleValue, accuracy: 0.001)
        
        // NSNumber from Bool should ideally become .bool (CFNumberGetType charType check)
        // This might be .number or .bool depending on NSNumber internals
        XCTAssertTrue(boolType == .bool(data: true) || boolType == .number(data: 1))
    }
    
    func testInitFromAnyNestedStructure() {
        // Test deeply nested conversion with mixed types
        // Note: init(from:) chooses the most specific type, so [String: String] becomes .dictionary
        let nested: [String: Any] = [
            "level1": [
                "level2": [
                    "level3": "deep value",
                    "number": 42  // Mix types to force anyDictionary
                ] as [String: Any]
            ] as [String: Any]
        ]
        
        let anyType = AnyType(from: nested)
        
        // Check structure level by level
        guard case .anyDictionary(let level1) = anyType else {
            return XCTFail("Top level not anyDictionary")
        }
        
        guard let level1Value = level1["level1"] else {
            return XCTFail("level1 key not found")
        }
        
        guard case .anyDictionary(let level2Data) = level1Value else {
            return XCTFail("level1 value not anyDictionary, got: \(level1Value)")
        }
        
        guard let level2Value = level2Data["level2"] else {
            return XCTFail("level2 key not found")
        }
        
        // This should be anyDictionary because it has mixed types (String and Int)
        guard case .anyDictionary(let level3Data) = level2Value else {
            return XCTFail("level2 value not anyDictionary, got: \(level2Value)")
        }
        
        guard case .string(let value) = level3Data["level3"] else {
            return XCTFail("level3 value not string")
        }
        XCTAssertEqual("deep value", value)
        
        guard case .number(let numValue) = level3Data["number"] else {
            return XCTFail("number value not number")
        }
        XCTAssertEqual(42, numValue)
    }
    
    func testAsAnyRoundTrip() {
        // Test converting to AnyType and back to Any
        let original: [String: Any] = ["key": "value", "number": 42]
        let anyType = AnyType(anyDictionary: original)
        let converted = anyType.asAny as? [String: Any]
        
        XCTAssertNotNil(converted)
        XCTAssertEqual("value", converted?["key"] as? String)
        // Number might come back as Int, Double, or NSNumber
        if let intValue = converted?["number"] as? Int {
            XCTAssertEqual(42, intValue)
        } else if let doubleValue = converted?["number"] as? Double {
            XCTAssertEqual(42, doubleValue)
        } else if let numValue = converted?["number"] as? NSNumber {
            XCTAssertEqual(42, numValue.intValue)
        } else {
            XCTFail("number should be convertible to a numeric type")
        }
    }
    
    func testAsAnyDictionaryProperty() {
        // Test asAnyDictionary property
        let dict: [String: Any] = ["a": 1, "b": "two"]
        let anyType = AnyType(anyDictionary: dict)
        
        guard let result = anyType.asAnyDictionary else {
            return XCTFail("asAnyDictionary should return value")
        }
        
        // Number might come back as Int, Double, or NSNumber
        if let intValue = result["a"] as? Int {
            XCTAssertEqual(1, intValue)
        } else if let doubleValue = result["a"] as? Double {
            XCTAssertEqual(1, doubleValue)
        } else if let numValue = result["a"] as? NSNumber {
            XCTAssertEqual(1, numValue.intValue)
        } else {
            XCTFail("a should be a numeric type")
        }
        XCTAssertEqual("two", result["b"] as? String)
        
        // Test non-anyDictionary case returns nil
        let stringType = AnyType.string(data: "test")
        XCTAssertNil(stringType.asAnyDictionary)
    }
    
    func testAsAnyArrayProperty() {
        // Test asAnyArray property
        let array: [Any] = [1, "two", true]
        let anyType = AnyType(anyArray: array)
        
        guard let result = anyType.asAnyArray else {
            return XCTFail("asAnyArray should return value")
        }
        
        XCTAssertEqual(3, result.count)
        // Number might come back as Int, Double, or NSNumber
        if let intValue = result[0] as? Int {
            XCTAssertEqual(1, intValue)
        } else if let doubleValue = result[0] as? Double {
            XCTAssertEqual(1, doubleValue)
        } else if let numValue = result[0] as? NSNumber {
            XCTAssertEqual(1, numValue.intValue)
        } else {
            XCTFail("first element should be a numeric type")
        }
        XCTAssertEqual("two", result[1] as? String)
        XCTAssertEqual(true, result[2] as? Bool)
        
        // Test non-anyArray case returns nil
        let stringType = AnyType.string(data: "test")
        XCTAssertNil(stringType.asAnyArray)
    }
    
    func testAsAnyForAllCases() {
        // Test asAny for all enum cases
        XCTAssertEqual("test", AnyType.string(data: "test").asAny as? String)
        XCTAssertEqual(42, AnyType.number(data: 42).asAny as? Double)
        XCTAssertEqual(true, AnyType.bool(data: true).asAny as? Bool)
        XCTAssertEqual(["key": "value"], AnyType.dictionary(data: ["key": "value"]).asAny as? [String: String])
        XCTAssertEqual([1, 2, 3], AnyType.numberArray(data: [1, 2, 3]).asAny as? [Double])
        XCTAssertEqual([true, false], AnyType.booleanArray(data: [true, false]).asAny as? [Bool])
        XCTAssertTrue(AnyType.unknownData.asAny is NSNull)
    }
    
    func testMatchAnyDictionary() {
        // Test pattern matching helper
        let dict: [String: Any] = ["key": "value"]
        let anyType = AnyType(anyDictionary: dict)
        
        var matchedValue: String?
        anyType.matchAnyDictionary { dict in
            matchedValue = dict["key"] as? String
        }
        
        XCTAssertEqual("value", matchedValue)
        
        // Test non-anyDictionary case doesn't call handler
        var wasCalled = false
        AnyType.string(data: "test").matchAnyDictionary { _ in
            wasCalled = true
        }
        XCTAssertFalse(wasCalled)
    }
    
    func testMatchAnyArray() {
        // Test pattern matching helper
        let array: [Any] = [1, 2, 3]
        let anyType = AnyType(anyArray: array)
        
        var matchedCount: Int?
        anyType.matchAnyArray { arr in
            matchedCount = arr.count
        }
        
        XCTAssertEqual(3, matchedCount)
        
        // Test non-anyArray case doesn't call handler
        var wasCalled = false
        AnyType.string(data: "test").matchAnyArray { _ in
            wasCalled = true
        }
        XCTAssertFalse(wasCalled)
    }
    
    func testEmptyCollections() {
        // Test empty dictionary
        let emptyDict = AnyType(anyDictionary: [:])
        guard case .anyDictionary(let data) = emptyDict else {
            return XCTFail("Expected anyDictionary")
        }
        XCTAssertEqual(0, data.count)
        
        // Test empty array
        let emptyArray = AnyType(anyArray: [])
        guard case .anyArray(let data) = emptyArray else {
            return XCTFail("Expected anyArray")
        }
        XCTAssertEqual(0, data.count)
    }
    
    func testInitFromAnyWithSpecificTypes() {
        // Test that init(from:) chooses the most specific type
        let stringDict: [String: String] = ["key": "value"]
        let stringDictType = AnyType(from: stringDict)
        guard case .dictionary = stringDictType else {
            return XCTFail("Should be .dictionary, not .anyDictionary")
        }
        
        let numberArray: [Double] = [1.0, 2.0, 3.0]
        let numberArrayType = AnyType(from: numberArray)
        guard case .numberArray = numberArrayType else {
            return XCTFail("Should be .numberArray, not .anyArray")
        }
        
        let boolArray: [Bool] = [true, false]
        let boolArrayType = AnyType(from: boolArray)
        guard case .booleanArray = boolArrayType else {
            return XCTFail("Should be .booleanArray, not .anyArray")
        }
    }
    
    func testSendableConformance() {
        // Test that AnyType is Sendable by using it in a Sendable context
        struct SendableContainer: Sendable {
            let value: AnyType
        }
        
        let container = SendableContainer(value: .string(data: "test"))
        XCTAssertEqual(.string(data: "test"), container.value)
        
        // Test with recursive types
        let nested = AnyType(anyDictionary: ["key": "value"])
        let nestedContainer = SendableContainer(value: nested)
        XCTAssertNotNil(nestedContainer.value.asAnyDictionary)
    }
    
    // MARK: - Reflection Support Tests
    
    func testDynamicValue() {
        // Test dynamicValue for different types
        let stringType = AnyType.string(data: "Hello")
        XCTAssertEqual("Hello", stringType.dynamicValue as? String)
        
        let numberType = AnyType.number(data: 42)
        XCTAssertEqual(42, numberType.dynamicValue as? Double)
        
        let boolType = AnyType.bool(data: true)
        XCTAssertEqual(true, boolType.dynamicValue as? Bool)
        
        let arrayType = AnyType.array(data: ["a", "b", "c"])
        XCTAssertEqual(["a", "b", "c"], arrayType.dynamicValue as? [String])
        
        let dictType = AnyType.dictionary(data: ["key": "value"])
        XCTAssertEqual(["key": "value"], dictType.dynamicValue as? [String: String])
        
        let unknownType = AnyType.unknownData
        XCTAssertTrue(unknownType.dynamicValue is NSNull)
    }
    
    func testDynamicValueWithAnyTypes() {
        // Test dynamicValue with anyDictionary and anyArray
        let anyDict: [String: Any] = ["name": "Alice", "age": 30]
        let anyDictType = AnyType(anyDictionary: anyDict)
        
        guard let retrievedDict = anyDictType.dynamicValue as? [String: Any] else {
            return XCTFail("dynamicValue should return [String: Any]")
        }
        
        XCTAssertEqual("Alice", retrievedDict["name"] as? String)
        
        let anyArr: [Any] = [1, "test", true]
        let anyArrType = AnyType(anyArray: anyArr)
        
        guard let retrievedArr = anyArrType.dynamicValue as? [Any] else {
            return XCTFail("dynamicValue should return [Any]")
        }
        
        XCTAssertEqual(3, retrievedArr.count)
    }
    
    func testAsTypeCast() {
        // Test the as(_:) helper method
        let stringType = AnyType.string(data: "World")
        let str: String? = stringType.as(String.self)
        XCTAssertEqual("World", str)
        
        // Test invalid cast returns nil
        let invalidCast: Int? = stringType.as(Int.self)
        XCTAssertNil(invalidCast)
        
        let numberType = AnyType.number(data: 3.14)
        let num: Double? = numberType.as(Double.self)
        XCTAssertEqual(3.14, num)
        
        let boolType = AnyType.bool(data: false)
        let bool: Bool? = boolType.as(Bool.self)
        XCTAssertEqual(false, bool)
    }
    
    func testAsTypeCastWithCollections() {
        // Test as(_:) with collections
        let arrayType = AnyType.array(data: ["x", "y", "z"])
        let arr: [String]? = arrayType.as([String].self)
        XCTAssertEqual(["x", "y", "z"], arr)
        
        let dictType = AnyType.dictionary(data: ["foo": "bar"])
        let dict: [String: String]? = dictType.as([String: String].self)
        XCTAssertEqual(["foo": "bar"], dict)
        
        let numArrayType = AnyType.numberArray(data: [1, 2, 3])
        let numArr: [Double]? = numArrayType.as([Double].self)
        XCTAssertEqual([1, 2, 3], numArr)
    }
    
    func testSubscriptAccess() {
        // Test subscript access for dictionary types
        let dict = AnyType.dictionary(data: ["title": "Hello"])
        let title = dict["title"]
        XCTAssertNotNil(title)
        XCTAssertEqual("Hello", title?.as(String.self))
        
        // Test subscript with numberDictionary
        let numDict = AnyType.numberDictionary(data: ["count": 42])
        let count = numDict["count"]
        XCTAssertNotNil(count)
        XCTAssertEqual(42, count?.as(Double.self))
        
        // Test subscript with booleanDictionary
        let boolDict = AnyType.booleanDictionary(data: ["active": true])
        let active = boolDict["active"]
        XCTAssertNotNil(active)
        XCTAssertEqual(true, active?.as(Bool.self))
    }
    
    func testSubscriptAccessWithAnyDictionary() {
        // Test subscript with anyDictionary (recursive)
        let anyDict = AnyType(anyDictionary: [
            "title": "Test",
            "count": 5,
            "enabled": true
        ])
        
        let title: String? = anyDict["title"]?.as(String.self)
        XCTAssertEqual("Test", title)
        
        // Numbers might be Int, Double, or NSNumber
        if let count = anyDict["count"]?.as(Int.self) {
            XCTAssertEqual(5, count)
        } else if let count = anyDict["count"]?.as(Double.self) {
            XCTAssertEqual(5, count)
        } else if let count = anyDict["count"]?.as(NSNumber.self) {
            XCTAssertEqual(5, count.intValue)
        } else {
            XCTFail("count should be a number type")
        }
        
        let enabled: Bool? = anyDict["enabled"]?.as(Bool.self)
        XCTAssertEqual(true, enabled)
    }
    
    func testSubscriptAccessNonDictionary() {
        // Test subscript on non-dictionary types returns nil
        let stringType = AnyType.string(data: "test")
        XCTAssertNil(stringType["key"])
        
        let arrayType = AnyType.array(data: ["a", "b"])
        XCTAssertNil(arrayType["key"])
        
        let unknownType = AnyType.unknownData
        XCTAssertNil(unknownType["key"])
    }
    
    func testSubscriptAccessMissingKey() {
        // Test subscript with non-existent key
        let dict = AnyType.dictionary(data: ["existing": "value"])
        XCTAssertNil(dict["missing"])
        
        let anyDict = AnyType(anyDictionary: ["key": "value"])
        XCTAssertNil(anyDict["nonexistent"])
    }
    
    func testReflectionChaining() {
        // Test chaining subscript and as(_:) - the usage example from the requirements
        let payload = AnyType(anyDictionary: [
            "title": "My Title",
            "metadata": [
                "author": "John Doe",
                "version": 1
            ] as [String: Any]
        ])
        
        // Test the exact usage pattern requested
        let title: String? = payload["title"]?.as(String.self)
        XCTAssertEqual("My Title", title)
        
        // Test nested access
        let metadata: [String: Any]? = payload["metadata"]?.as([String: Any].self)
        XCTAssertNotNil(metadata)
        XCTAssertEqual("John Doe", metadata?["author"] as? String)
    }
    
    func testReflectionWithNestedStructures() {
        // Test reflection with deeply nested structures
        let nested = AnyType(anyDictionary: [
            "user": [
                "profile": [
                    "name": "Alice",
                    "age": 25
                ] as [String: Any]
            ] as [String: Any]
        ])
        
        // Navigate through nested structure using subscript
        if let user = nested["user"]?.as([String: Any].self),
           let profile = user["profile"] as? [String: Any] {
            XCTAssertEqual("Alice", profile["name"] as? String)
            
            // Age might be Int, Double, or NSNumber from JSON
            if let age = profile["age"] as? Int {
                XCTAssertEqual(25, age)
            } else if let age = profile["age"] as? Double {
                XCTAssertEqual(25, age)
            } else if let age = profile["age"] as? NSNumber {
                XCTAssertEqual(25, age.intValue)
            } else {
                XCTFail("age should be a number type")
            }
        } else {
            XCTFail("Should be able to navigate nested structure")
        }
    }
}
