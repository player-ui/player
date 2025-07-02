//
//  ActionAssetTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/8/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector

@testable import PlayerUI
@testable import PlayerUITestUtilities
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI
@testable import PlayerUIBeaconPlugin

@MainActor
class ActionAssetTests: SwiftUIAssetUnitTestCase {
    override open func plugins() -> [NativePlugin] { [ReferenceAssetsPlugin()] }

    func setup() {
        XCUIApplication().terminate()
    }

    func testAssetDecoding() async throws {
        let json = """
        {
          "id": "action",
          "type": "action",
          "exp": "{{count}} = {{count}} + 1",
          "label": {
            "asset": {
              "id": "action-label",
              "type": "text",
              "value": "Clickoed {{count}} times"
            }
          }
        }
        """

        guard let action: ActionAsset = await getAsset(json) else {
            return XCTFail("unable to get asset")
        }

        _ = try action.view.inspect().find(ActionAssetView.self).button()

    }
    func testViewNoLabel() throws {
        let data = ActionData(id: "id", type: "action", label: nil, run: nil)

        let model = AssetViewModel<ActionData>(data)

        let view = ActionAssetView(model: model)

        _ = try view.inspect().button()
    }

    func testViewWithLabel() async throws {
        guard let text: TextAsset = await getAsset("""
        {"id": "text", "type": "text", "value":"hello world"}
        """)
        else { return XCTFail("unable to get asset") }
        let data = ActionData(id: "id", type: "action", label: WrappedAsset(forAsset: text), run: nil)

        let model = AssetViewModel<ActionData>(data)

        let view = ActionAssetView(model: model)

        _ = try view.inspect().button()

        let label = try text.view.inspect().find(TextAssetView.self).text()

        XCTAssertEqual("hello world", try label.string())
    }

    func testRunsFunction() throws {
        let runExpect = expectation(description: "Beacon Called")
        guard let run: WrappedFunction<Void> = getWrappedFunction(completion: { runExpect.fulfill() }) else {
            return XCTFail("unable to get function")
        }
        let data = ActionData(id: "id", type: "action", label: nil, run: run)

        let model = AssetViewModel<ActionData>(data)

        var view = ActionAssetView(model: model)

        let appear = view.on(\.didAppear) { view in
            try view.button().tap()
        }

        ViewHosting.host(view: view)

        wait(for: [appear, runExpect], timeout: 5)
    }

    func testSendsBeacon() throws {
        let data = ActionData(id: "id", type: "action", label: nil, run: nil)

        let model = AssetViewModel<ActionData>(data)

        var view = ActionAssetView(model: model)

        let expect = expectation(description: "Beacon Called")

        let appear = view.on(\.didAppear) { view in
            try view.button().tap()
        }

        ViewHosting.host(view: view.environment(\.beaconContext, BeaconContext({ _ in
            expect.fulfill()
        })))

        wait(for: [appear, expect], timeout: 5)
    }
}
