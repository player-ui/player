//
//  AssetUnitTestCaseTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 2/1/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import XCTest
import SwiftUI
@testable import PlayerUI

struct ExampleAssetData: AssetData {
    var id: String
    var type: String
    var value: String
    var nested: WrappedAsset?
    var function: WrappedFunction<Void>?
}

struct ExampleAssetView: View {
    @ObservedObject var model: AssetViewModel<ExampleAssetData>

    var body: some View {
        Button(action: { model.data.function?() }, label: { Text(model.data.value) })
    }
}

class ExampleAsset: UncontrolledAsset<ExampleAssetData> {
    override var view: AnyView { AnyView(ExampleAssetView(model: model)) }
}

class AssetUnitTestDefaultTests: SwiftUIAssetUnitTestCase {
    func testDefaultRegister() {
        let player = TestPlayer<WrappedAsset, SwiftUIRegistry>(plugins: [self], registry: SwiftUIRegistry(logger: TapableLogger()))
        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 0)
    }
}

class AssetUnitTestCaseTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("test", asset: ExampleAsset.self)
    }

    func testRegistration() {
        let player = TestPlayer<WrappedAsset, SwiftUIRegistry>(plugins: [self], registry: SwiftUIRegistry(logger: TapableLogger()))
        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 1)
    }

    func testDefaultPlugins() {
        XCTAssertEqual(0, self.plugins().count)
    }

    func testShouldNotDecode() async {
        let assetJSON = """
        {
            "id": "test-id",
            "type": "test"
        }
        """
        let asset: ExampleAsset? = await getAsset(assetJSON)

        XCTAssertNil(asset)
    }

    func testShouldDecode() async {
        let assetJSON = """
        {
            "id": "test-id",
            "type": "test",
            "value": "test value"
        }
        """
        let asset: ExampleAsset? = await getAsset(assetJSON)

        XCTAssertNotNil(asset)
        XCTAssertEqual("test value", asset?.model.data.value)
    }

    func testShouldDecodeFlow() async {
        let assetJSON = """
        {
          "id": "generated-flow",
          "views": [
            {
              "id": "test-id",
              "type": "test",
              "value": "test value"
            }
          ],
          "data": {},
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "test-id",
                "transitions": {
                  "*": "END_Done"
                }
              },
              "END_Done": {
                "state_type": "END",
                "outcome": "done"
              }
            }
          }
        }
        """
        let asset: ExampleAsset? = await getAsset(assetJSON)

        XCTAssertNotNil(asset)
        XCTAssertEqual("test value", asset?.model.data.value)
    }

    func testShouldRunFunction() async {
        let assetJSON = """
        {
            "id": "test-id",
            "type": "test",
            "value": "test value"
        }
        """
        let functionExpecation = expectation(description: "FunctionWrapper called")
        guard
            let asset: ExampleAsset = await getAsset(assetJSON),
            let function: WrappedFunction<Void> = getWrappedFunction(completion: {
                functionExpecation.fulfill()
            })
        else { return XCTFail("could not create function") }

        asset.model.data.function = function

        asset.model.data.function?.callAsFunction()
        wait(for: [functionExpecation], timeout: 1)
    }

    func testNotEquatableAssetDatasAreNotEqual() {
        let asset1 = NotEquatableAssetData(id: UUID().uuidString)
        let asset2 = NotEquatableAssetData(id: asset1.id)
        XCTAssertFalse(asset1.isEqual(asset2))
    }

    func testNotEquatableAndEquatableAssetDataAreNotEqual() {
        let asset1 = NotEquatableAssetData(id: UUID().uuidString)
        let asset2 = EquatableAssetData(id: asset1.id)
        XCTAssertFalse(asset1.isEqual(asset2))
    }

    func testSameEquatableAssetDatasAreEqual() {
        let asset1 = EquatableAssetData(id: UUID().uuidString)
        let asset2 = EquatableAssetData(id: asset1.id)
        XCTAssertTrue(asset1.isEqual(asset2))
    }

    func testDifferentEquatableAssetDatasAreNotEqual() {
        let asset1 = EquatableAssetData(id: UUID().uuidString, value: "a")
        let asset2 = EquatableAssetData(id: asset1.id, value: "b")
        XCTAssertFalse(asset1.isEqual(asset2))
    }

    func testDifferentEquatableTypesAreNotEqual() {
        struct OtherEquatableAssetData: AssetData, Equatable {
            let id: String
            var type: String { "Equatable" }
            var value: String = "value"
        }

        let asset1 = OtherEquatableAssetData(id: UUID().uuidString)
        let asset2 = EquatableAssetData(id: asset1.id)
        XCTAssertFalse(asset1.isEqual(asset2))
    }
}

private struct EquatableAssetData: AssetData, Equatable {
    let id: String
    var type: String { "Equatable" }
    var value: String = "value"
}

private struct NotEquatableAssetData: AssetData {
    let id: String
    var type: String { "NotEquatable" }
}
