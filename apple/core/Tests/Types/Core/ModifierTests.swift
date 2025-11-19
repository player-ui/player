//
//  ModifierTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 9/16/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
@testable import PlayerUI

class ModifierTests: XCTestCase {
    // this is really just for coverage because structs dont get public inits for free
    func testModifier() {
        let meta = ModifierMetaData(ref: "ref")
        let mod = Modifier(type: "type", value: "value", name: "name", metaData: meta)
        XCTAssertEqual("type", mod.type)
        XCTAssertEqual("value", mod.value)
        XCTAssertEqual("name", mod.name)
        XCTAssertEqual("ref", mod.metaData?.ref)
    }

    func testDecodeStringValueModifier() throws {
        let data = String.stringValueModifier.data(using: .utf8) ?? Data()
        let modifier = try JSONDecoder().decode(Modifier.self, from: data)
        XCTAssertEqual(modifier.value, "emphasis")
    }

    func testDecodeIntValueModifier() throws {
        let data = String.intValueModifier.data(using: .utf8) ?? Data()
        let modifier = try JSONDecoder().decode(Modifier.self, from: data)
        XCTAssertEqual(modifier.intValue, 7)
    }

    func testDecodeDoubleValueModifier() throws {
        let data = String.doubleValueModifier.data(using: .utf8) ?? Data()
        let modifier = try JSONDecoder().decode(Modifier.self, from: data)
        XCTAssertEqual(modifier.doubleValue, 3.14)
    }

    func testDecodeFullMetaDataModifier() throws {
        let data = String.fullMetadata.data(using: .utf8) ?? Data()
        let modifier = try JSONDecoder().decode(Modifier.self, from: data)
        let metadata = ModifierMetaData(ref: "someref", source: "somesource", mimeType: "somemime", maxLine: 5)
        XCTAssertEqual(modifier.metaData, metadata)
    }

    func testDecodeEmptyMetaDataModifier() throws {
        let data = String.emptyMetadata.data(using: .utf8) ?? Data()
        let modifier = try JSONDecoder().decode(Modifier.self, from: data)
        let metadata = ModifierMetaData(ref: nil)
        XCTAssertEqual(modifier.metaData, metadata)
    }
}

private extension String {
    static let stringValueModifier = """
    {
        "name": "M0",
        "type": "tag",
        "value": "emphasis"
    }
    """

    static let intValueModifier = """
    {
        "name": "M0",
        "type": "tag",
        "value": 7
    }
    """

    static let doubleValueModifier = """
    {
        "name": "M0",
        "type": "tag",
        "value": 3.14
    }
    """

    static let fullMetadata = """
    {
        "name": "M0",
        "type": "tag",
        "value": 3.14,
        "metaData": {
            "ref": "someref",
            "source": "somesource",
            "mime-type": "somemime",
            "maxLine": 5
        }
    }
    """

    static let emptyMetadata = """
    {
        "name": "M0",
        "type": "tag",
        "value": 3.14,
        "metaData": {}
    }
    """
}
