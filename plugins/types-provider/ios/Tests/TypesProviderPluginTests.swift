//
//  TypesProviderPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 6/25/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITypesProviderPlugin

class TypesProviderPluginTests: XCTestCase {
    func testFormatReferenceConversion() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let formatRef = FormatReference(type: "test", options: ["someOption": "someValue"])
        XCTAssertEqual(
            Set(["type", "someOption"]),
            Set(plugin.formatRefToDict(formatRef).keys.map {$0})
        )
    }

    func testFormatReferenceDefaultOptionsConversion() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let formatRef = FormatReference(type: "test")
        XCTAssertEqual(
            Set(["type"]),
            Set(plugin.formatRefToDict(formatRef).keys.map {$0})
        )
    }

    func testValidationReferenceConversion() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let validationRef = ValidationReference(type: "test", message: "Bad Value", severity: "error", trigger: "start", options: ["someOption": "someValue"])

        let validationRefExpect = Set([
            "type",
            "message",
            "severity",
            "trigger",
            "someOption"
        ])

        XCTAssertEqual(
            validationRefExpect,
            Set(plugin.valRefToDict(validationRef).keys.map {$0})
        )
    }

    func testCustomTypeConversion() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let customType = CustomType(type: "", validation: [], format: nil, isArray: false, defaultValue: 1)
        let customTypeExpect = Set([
            "type",
            "validation",
            "format",
            "isArray",
            "defaultValue"
        ])

        XCTAssertEqual(
            customTypeExpect,
            Set(plugin.typeToJs(customType).keys.map {$0})
        )
    }

    func testValidationHandler() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let validationExpectation = XCTestExpectation(description: "Validation Called")
        let validation = ValidationDeclaration(type: "test", handler: {_, _, _ in
            validationExpectation.fulfill()
        })

        let val = plugin.validatorToJs(validation)
        val?.objectAtIndexedSubscript(1)?.call(withArguments: [])
        wait(for: [validationExpectation], timeout: 1)
    }

    func testFormatHandlers() {
        let plugin = TypesProviderPlugin(types: [], validators: [], formats: [])
        plugin.context = JSContext()

        let formatExpectation = XCTestExpectation(description: "Format Called")
        let deformatExpectation = XCTestExpectation(description: "Deformat Called")

        let formatDec = FormatDeclaration(
            name: "test",
            format: {_, _ in
                formatExpectation.fulfill()
            }, deformat: {_, _ in
                deformatExpectation.fulfill()
            }
        )

        let val = plugin.formatToJs(formatDec)

        val?.objectForKeyedSubscript("format")?.call(withArguments: [])
        wait(for: [formatExpectation], timeout: 1)

        val?.objectForKeyedSubscript("deformat")?.call(withArguments: [])
        wait(for: [deformatExpectation], timeout: 1)
    }
}
