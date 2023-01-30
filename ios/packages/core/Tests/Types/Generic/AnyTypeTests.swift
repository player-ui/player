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
    }

    func doEncode(_ data: AnyType) -> String? {
        let data = try? JSONEncoder().encode(data)
        guard let data = data else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
