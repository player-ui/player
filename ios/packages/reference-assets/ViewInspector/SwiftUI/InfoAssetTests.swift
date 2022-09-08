//
//  InfoAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/9/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import SwiftUI
import ViewInspector
import XCTest

@testable import PlayerUI

extension InfoAssetView: Inspectable {}

class InfoAssetTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("info", asset: InfoAsset.self)
        registry.register("text", asset: TextAsset.self)
        registry.register("action", asset: ActionAsset.self)
    }

    func testDecoding() async throws {
        let json = """
        {
          "id": "view-1",
          "type": "info",
          "title": {
            "asset": {
              "id": "view-title",
              "type": "text",
              "value": "View 1"
            }
          },
          "actions": [
            {
              "asset": {
                "id": "action-1",
                "type": "action",
                "value": "Next",
                "label": {
                  "asset": {
                    "id": "action-1-label",
                    "type": "text",
                    "value": "Next"
                  }
                }
              }
            }
          ]
        }
        """

        guard let info: InfoAsset = await getAsset(json) else { return XCTFail("could not get asset") }

        _ = try info.view.inspect().find(InfoAssetView.self)
    }

    func testView() async throws {
        guard
            let title: TextAsset = await getAsset("{\"id\": \"text\", \"type\": \"text\", \"value\":\"hello world\"}"),
            let action1: ActionAsset = await getAsset("{\"id\": \"action1\", \"type\": \"action\", \"value\":\"next\"}"),
            let action2: ActionAsset = await getAsset("{\"id\": \"action2\", \"type\": \"action\", \"value\":\"prev\"}")
        else { return XCTFail("could not get assets") }

        let data = InfoData(
            id: "info",
            type: "info",
            title: WrappedAsset(forAsset: title),
            actions: [
                WrappedAsset(forAsset: action1),
                WrappedAsset(forAsset: action2)
            ]
        )
        let model = AssetViewModel<InfoData>(data)
        let view = await InfoAssetView(model: model)

        let stack = try view.inspect().vStack()

        XCTAssertEqual(stack.count, 4)

        let forEach = try stack.forEach(3)

        XCTAssertEqual(forEach.count, 2)

        _ = try forEach.anyView(0).find(ActionAssetView.self).button()
    }
}
