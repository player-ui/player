//
//  SwiftUIAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore

@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUILogger
@testable import PlayerUIReferenceAssets

class SwiftUIAssetTests: XCTestCase {
    let context: JSContext = JSContext()
    func testBaseAssetDecoding() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'someType', value: 'someValue'})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("someType", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let value = val else { return XCTFail("value should not have been nil") }

        let asset = try registry.decode(value)

        XCTAssertNotNil(asset)
        XCTAssertEqual(asset.id, "someId")
        XCTAssertEqual(asset.type, "someType")
    }

    func testWrappedAssetDecoding() throws {
        let val = context.evaluateScript("({asset: {id: 'someId', type: 'someType', value: 'someValue'}})")

        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("someType", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let value = val else { return XCTFail("value should not have been nil") }

        let wrapper = try registry.decodeWrapper(value)

        XCTAssertNotNil(wrapper.asset)
        XCTAssertEqual(wrapper.asset?.id, "someId")
        XCTAssertEqual(wrapper.asset?.type, "someType")
    }

    func testFallbackWrappedAssetConstructor() throws {
        let val = context.evaluateScript("({id: 'someId', type: 'someType', value: 'someValue'})")
        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("someType", asset: TextAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let value = val else { return XCTFail("value should not have been nil") }

        let asset = try registry.decode(value)
        let wrapper = WrappedAsset(forAsset: asset)

        XCTAssertEqual(wrapper.asset?.id, "someId")
        XCTAssertEqual(wrapper.asset?.type, "someType")

    }
}
