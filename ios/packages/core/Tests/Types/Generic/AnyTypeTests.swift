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

    func testUnknownData() {
        let string = "1"
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
}
