//
//  CollectionAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/9/21.
//  Copyright © 2021 Intuit. All rights reserved.
//

import Foundation
import XCTest
import ViewInspector
import SwiftUI

@testable import PlayerUI
@testable import PlayerUITestUtilities
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI

@MainActor
class CollectionAssetTests: SwiftUIAssetUnitTestCase {
    override open func plugins() -> [NativePlugin] { [ReferenceAssetsPlugin()] }

    func testDecoding() async throws {
        let json = """
        {
          "id": "collection",
          "type": "collection",
          "values": [
            {
              "asset": {
                "id": "value-1",
                "type": "text",
                "value": "First value in the collection"
              }
            },
            {
              "asset": {
                "id": "value-2",
                "type": "text",
                "value": "Second value in the collection"
              }
            }
          ]
        }
        """

        guard let collection: CollectionAsset = await getAsset(json) else { return XCTFail("could not get asset") }

        _ = try collection.view.inspect().find(CollectionAssetView.self).vStack()
    }

    /// Verifies that a collection with a label and values decodes correctly from JSON
    /// and renders all expected text content in the view hierarchy.
    func testDecodingWithLabel() async throws {
        let json = """
        {
          "id": "collection",
          "type": "collection",
          "label": {
            "asset": {
              "id": "collection-label",
              "type": "text",
              "value": "Collection Title"
            }
          },
          "values": [
            {
              "asset": {
                "id": "value-1",
                "type": "text",
                "value": "First value in the collection"
              }
            },
            {
              "asset": {
                "id": "value-2",
                "type": "text",
                "value": "Second value in the collection"
              }
            }
          ]
        }
        """

        guard let collection: CollectionAsset = await getAsset(json) else { return XCTFail("could not get asset") }

        let stack = try collection.view.inspect().find(CollectionAssetView.self).vStack()
        // Verify the label is present in the view hierarchy
        _ = try stack.find(text: "Collection Title")
        // Verify both values are rendered
        _ = try stack.find(text: "First value in the collection")
        _ = try stack.find(text: "Second value in the collection")
    }

    func testView() async throws {
        guard
            let text1: TextAsset = await getAsset("{\"id\": \"text\", \"type\": \"text\", \"value\":\"hello world\"}"),
            let text2: TextAsset = await getAsset("{\"id\": \"text2\", \"type\": \"text\", \"value\":\"goodbye world\"}")
        else { return XCTFail("could not get assets") }
        let model = AssetViewModel<CollectionData>(
            CollectionData(
                id: "collection",
                type: "collection",
                values: [
                    WrappedAsset(forAsset: text1),
                    WrappedAsset(forAsset: text2)
                ]
            )
        )

        let view = CollectionAssetView(model: model)

        let stack = try view.inspect().vStack()

        let forEach = try stack.find(ViewType.ForEach.self)
        XCTAssertEqual(2, forEach.count)
        _ = try stack.find(text: "hello world")
        _ = try stack.find(text: "goodbye world")
    }

    /// Verifies that CollectionAssetView renders both a label and values
    /// when a label is provided in the model data.
    func testViewWithLabel() async throws {
        guard
            let label: TextAsset = await getAsset("{\"id\": \"label\", \"type\": \"text\", \"value\":\"My Collection\"}"),
            let text1: TextAsset = await getAsset("{\"id\": \"text\", \"type\": \"text\", \"value\":\"hello world\"}"),
            let text2: TextAsset = await getAsset("{\"id\": \"text2\", \"type\": \"text\", \"value\":\"goodbye world\"}")
        else { return XCTFail("could not get assets") }
        let model = AssetViewModel<CollectionData>(
            CollectionData(
                id: "collection",
                type: "collection",
                label: WrappedAsset(forAsset: label),
                values: [
                    WrappedAsset(forAsset: text1),
                    WrappedAsset(forAsset: text2)
                ]
            )
        )

        let view = CollectionAssetView(model: model)

        let stack = try view.inspect().vStack()

        // Verify the label is rendered
        _ = try stack.find(text: "My Collection")
        // Verify the ForEach contains the correct number of value items
        let forEach = try stack.find(ViewType.ForEach.self)
        XCTAssertEqual(2, forEach.count)
        // Verify each value's text content
        _ = try stack.find(text: "hello world")
        _ = try stack.find(text: "goodbye world")
    }
}
