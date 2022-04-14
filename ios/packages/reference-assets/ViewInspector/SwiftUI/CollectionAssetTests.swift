//
//  CollectionAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/9/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import ViewInspector
import SwiftUI

@testable import PlayerUI

extension CollectionAssetView: Inspectable {}

class CollectionAssetTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("collection", asset: CollectionAsset.self)
        registry.register("text", asset: TextAsset.self)
    }

    func testDecoding() throws {
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

        guard let collection: CollectionAsset = getAsset(json) else { return XCTFail("could not get asset") }

        _ = try collection.view.inspect().find(CollectionAssetView.self).vStack()
    }

    func testView() throws {
        guard
            let text1: TextAsset = getAsset("{\"id\": \"text\", \"type\": \"text\", \"value\":\"hello world\"}"),
            let text2: TextAsset = getAsset("{\"id\": \"text2\", \"type\": \"text\", \"value\":\"goodbye world\"}")
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

        XCTAssertEqual(2, try stack.forEach(0).count)
        _ = try stack.find(text: "hello world")
        _ = try stack.find(text: "goodbye world")
    }
}
