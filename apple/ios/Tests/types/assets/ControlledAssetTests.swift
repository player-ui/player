//
//  ControlledAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
import Combine
@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUILogger

class ControlledAssetTests: XCTestCase {
    let context: JSContext = JSContext()

    struct SomeData: AssetData {
        var id: String
        var type: String
        var value: String
    }

    struct SomeOtherData: AssetData {
        var id: String
        var type: String
        var value: String
    }

    func testAssetViewModel() {
        let viewModel = AssetViewModel<SomeData>(SomeData(id: "someId", type: "someType", value: "test"))

        let updated = expectation(description: "data updated")
        viewModel.$data.sink { newData in
            if newData.value == "tested" {
                updated.fulfill()
            }
        }.store(in: &viewModel.bag)

        viewModel.data = SomeData(id: "someId", type: "someType", value: "tested")
        wait(for: [updated], timeout: 1)
    }

    func testControlledAsset() {
        class SomeAsset: ControlledAsset<SomeData, AssetViewModel<SomeData>> {}

        let val = context.evaluateScript("({id: 'someId', type: 'someType', value: 'someValue'})")
        let partialMatch = PartialMatchFingerprintPlugin()
        partialMatch.context = context
        partialMatch.setMapping(assetId: "someId", index: 0)
        let registry = SwiftUIRegistry(logger: TapableLogger())
        registry.register("someType", asset: SomeAsset.self)
        registry.partialMatchRegistry = partialMatch

        guard let value = val else { return XCTFail("value should not have been nil") }

        guard let asset = try? registry.decode(value) as? SomeAsset else { return XCTFail("could not decode asset") }

        XCTAssertEqual(asset.valueData.id, "someId")
        XCTAssertEqual(asset.valueData.type, "someType")

        let updated = expectation(description: "data updated")
        asset.model.$data.sink { newData in
            if newData.value == "tested" {
                updated.fulfill()
            }
        }.store(in: &asset.model.bag)

        asset.model.data = SomeData(id: "someId", type: "someType", value: "tested")

        wait(for: [updated], timeout: 1)
    }

    func testChangedDataIsPublished() throws {
        let decoder = JSONDecoder()
        decoder.addModelCacheForTesting()

        class TestViewModel: AssetViewModel<EquatableAssetData> {}
        let type = ControlledAsset<EquatableAssetData, TestViewModel>.self
        let dataExpectation = expectation(description: "Wait for data update")
        let asset1 = try decoder.decode(type, from: .asset11)
        let model = asset1.model
        let watchData = model.objectWillChange.sink { _ in
            dataExpectation.fulfill()
        }

        let asset2 = try decoder.decode(type, from: .asset12)
        let model2 = asset2.model

        XCTAssertTrue(model === model2)
        wait(for: [dataExpectation], timeout: 1)
        watchData.cancel()
    }

    func testUnchangedDataIsNotPublished() throws {
        let decoder = JSONDecoder()
        decoder.addModelCacheForTesting()

        let type = ControlledAsset<EquatableAssetData, AssetViewModel<EquatableAssetData>>.self
        let asset1 = try decoder.decode(type, from: .asset11)
        let model = asset1.model
        let watchData = model.objectWillChange.sink { _ in
            XCTFail("no change should be published")
        }

        let asset2 = try decoder.decode(type, from: .asset11)
        let model2 = asset2.model

        XCTAssertFalse(model === model2)
        watchData.cancel()
    }
}

private extension Data {
    static let asset11 = String.asset11.data(using: .utf8)!
    static let asset12 = String.asset12.data(using: .utf8)!
}

private extension String {
    static let asset11 = """
    { "id": "abc", "type": "Equatable", "value": "value1" }
    """

    static let asset12 = """
    { "id": "abc", "type": "Equatable", "value": "value2" }
    """
}

private struct EquatableAssetData: AssetData, Equatable {
    var id: String
    var type: String { "Equatable" }
    var value: String
}
