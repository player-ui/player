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
        // stringValue initializer is used for anyDictionary encoding
        XCTAssertNotNil(CustomEncodable(stringValue: "test"))
        
        // intValue initializer is required by CodingKey protocol but not used
        // (anyArray uses unkeyedContainer instead)
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
    
    func testSendableConformance() {
        // Test that AnyType is Sendable by using it in a Sendable context
        struct SendableContainer: Sendable {
            let value: AnyType
        }
        
        let container = SendableContainer(value: .string(data: "test"))
        XCTAssertEqual(.string(data: "test"), container.value)
        
        // Test with recursive types
        let nested = AnyType.anyDictionary(data: ["key": .string(data: "value")])
        let nestedContainer = SendableContainer(value: nested)
        guard case .anyDictionary = nestedContainer.value else {
            return XCTFail("Expected anyDictionary")
        }
    }
    
    // MARK: - Value Extraction Tests
    
    func testAsTypeCast() {
        // Test the as(_:) helper method for basic types
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
        // Test as(_:) with typed collections
        let arrayType = AnyType.array(data: ["x", "y", "z"])
        let arr: [String]? = arrayType.as([String].self)
        XCTAssertEqual(["x", "y", "z"], arr)
        
        let dictType = AnyType.dictionary(data: ["foo": "bar"])
        let dict: [String: String]? = dictType.as([String: String].self)
        XCTAssertEqual(["foo": "bar"], dict)
        
        let numArrayType = AnyType.numberArray(data: [1, 2, 3])
        let numArr: [Double]? = numArrayType.as([Double].self)
        XCTAssertEqual([1, 2, 3], numArr)
        
        let boolArrayType = AnyType.booleanArray(data: [true, false])
        let boolArr: [Bool]? = boolArrayType.as([Bool].self)
        XCTAssertEqual([true, false], boolArr)
    }
    
    func testAsTypeCastWithAnyCollections() {
        // Test as(_:) with recursive AnyType collections
        let anyDict = AnyType.anyDictionary(data: [
            "title": .string(data: "Test"),
            "count": .number(data: 5)
        ])
        let dict: [String: AnyType]? = anyDict.as([String: AnyType].self)
        XCTAssertNotNil(dict)
        XCTAssertEqual(2, dict?.count)
        
        let anyArr = AnyType.anyArray(data: [
            .string(data: "test"),
            .number(data: 42)
        ])
        let arr: [AnyType]? = anyArr.as([AnyType].self)
        XCTAssertNotNil(arr)
        XCTAssertEqual(2, arr?.count)
    }
    
    func testAsTypeCastWithUnknownData() {
        // Test that unknownData returns nil for all types
        let unknown = AnyType.unknownData
        XCTAssertNil(unknown.as(String.self))
        XCTAssertNil(unknown.as(Int.self))
        XCTAssertNil(unknown.as([String].self))
    }
    
    // MARK: - Subscript Access Tests
    
    func testSubscriptAccess() {
        // Test subscript access for dictionary types
        let dict = AnyType.dictionary(data: ["title": "Hello"])
        let title = dict["title"]
        XCTAssertNotNil(title)
        guard case .string(let value) = title else {
            return XCTFail("Expected string value")
        }
        XCTAssertEqual("Hello", value)
        
        // Test subscript with numberDictionary
        let numDict = AnyType.numberDictionary(data: ["count": 42])
        let count = numDict["count"]
        XCTAssertNotNil(count)
        guard case .number(let numValue) = count else {
            return XCTFail("Expected number value")
        }
        XCTAssertEqual(42, numValue)
        
        // Test subscript with booleanDictionary
        let boolDict = AnyType.booleanDictionary(data: ["active": true])
        let active = boolDict["active"]
        XCTAssertNotNil(active)
        guard case .bool(let boolValue) = active else {
            return XCTFail("Expected bool value")
        }
        XCTAssertEqual(true, boolValue)
    }
    
    func testSubscriptAccessWithAnyDictionary() {
        // Test subscript with anyDictionary (recursive)
        let anyDict = AnyType.anyDictionary(data: [
            "title": .string(data: "Test"),
            "count": .number(data: 5),
            "enabled": .bool(data: true)
        ])
        
        guard case .string(let titleValue) = anyDict["title"] else {
            return XCTFail("Expected string value")
        }
        XCTAssertEqual("Test", titleValue)
        
        guard case .number(let countValue) = anyDict["count"] else {
            return XCTFail("Expected number value")
        }
        XCTAssertEqual(5, countValue)
        
        guard case .bool(let enabledValue) = anyDict["enabled"] else {
            return XCTFail("Expected bool value")
        }
        XCTAssertEqual(true, enabledValue)
    }
    
    func testSubscriptWithAsCast() {
        // Test convenient subscript + as(_:) pattern
        let dict = AnyType.anyDictionary(data: [
            "title": .string(data: "My Title"),
            "count": .number(data: 42),
            "active": .bool(data: true)
        ])
        
        let title: String? = dict["title"]?.as(String.self)
        XCTAssertEqual("My Title", title)
        
        let count: Double? = dict["count"]?.as(Double.self)
        XCTAssertEqual(42, count)
        
        let active: Bool? = dict["active"]?.as(Bool.self)
        XCTAssertEqual(true, active)
        
        // Test invalid cast returns nil
        let invalidCast: Int? = dict["title"]?.as(Int.self)
        XCTAssertNil(invalidCast)
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
        
        let anyDict = AnyType.anyDictionary(data: ["key": .string(data: "value")])
        XCTAssertNil(anyDict["nonexistent"])
    }
}
