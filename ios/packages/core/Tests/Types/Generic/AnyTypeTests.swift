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
        switch anyType {
        case .anyDictionary(let result):
            XCTAssertEqual(false, result["key"] as? Bool)
            XCTAssertEqual(1, result["key2"] as? Double)
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
        XCTAssertEqual("{\"key\":false,\"key2\":1}", doEncode(AnyType.anyDictionary(data: ["key": false, "key2": 1])))
    }

    func doEncode(_ data: AnyType) -> String? {
        let data = try? JSONEncoder().encode(data)
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
        XCTAssertNotEqual(AnyType.anyDictionary(data: ["key": false, "key2": 1]).hashValue, 0)
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
        XCTAssertEqual(AnyType.anyDictionary(data: ["key": false, "key2": 1]), AnyType.anyDictionary(data: ["key": false, "key2": 1]))
        XCTAssertNotEqual(AnyType.unknownData, AnyType.string(data: "test"))
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
}
