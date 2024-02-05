//
//  SwiftUIAssetUnitTestCaseTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/8/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
import SwiftUI
import ViewInspector
import XCTest

@testable import PlayerUI

struct ExampleData: AssetData {
    var id: String
    var type: String
    var value: String
    var nested: WrappedAsset?
    var function: WrappedFunction<Void>?
}

struct ExampleView: View {
    @ObservedObject var model: AssetViewModel<ExampleData>
    var body: some View {
        Button(
            action: {self.model.data.function?()},
            label: { EmptyView() }
        )
    }
}

class ExampleSwiftUIAsset: UncontrolledAsset<ExampleData> {
    override var view: AnyView { AnyView(ExampleView(model: model)) }
}

extension ExampleView: Inspectable {}

class SwiftUIAssetUnitTestDefaultTests: SwiftUIAssetUnitTestCase {
    func testDefaultRegister() {
        let player = TestPlayer<WrappedAsset, SwiftUIRegistry>(plugins: [self], registry: SwiftUIRegistry(logger: TapableLogger()))
        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 0)
    }
}

class SwiftUIAssetUnitTestCaseTests: SwiftUIAssetUnitTestCase {
    override func register(registry: SwiftUIRegistry) {
        registry.register("test", asset: ExampleSwiftUIAsset.self)
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
        let asset: ExampleSwiftUIAsset? = await getAsset(assetJSON)

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
        let asset: ExampleSwiftUIAsset? = await getAsset(assetJSON)

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
        let asset: ExampleSwiftUIAsset? = await getAsset(assetJSON)

        XCTAssertNotNil(asset)
        XCTAssertEqual("test value", asset?.model.data.value)
    }

    func testShouldRunFunction() throws {
        let functionExpecation = expectation(description: "FunctionWrapper called")
        guard
            let function: WrappedFunction<Void> = getWrappedFunction(completion: {
                functionExpecation.fulfill()
            })
        else { return XCTFail("could not create function") }

        let model = AssetViewModel<ExampleData>(ExampleData(id: "id", type: "test", value: "hello", nested: nil, function: function))

        let view = ExampleView(model: model)
        let button = try view.inspect().button()

        try button.tap()

        wait(for: [functionExpecation], timeout: 1)
    }

    func testAsyncNodeWithSwiftUIPlayerUsingJSValue() {
        let handlerExpectation = XCTestExpectation(description: "handler called")
        let jsContext = JSContext()

        let plugin = AsyncNodePlugin { _ in
            handlerExpectation.fulfill()

            return .singleNode(.concrete(jsContext?.evaluateScript("""
                ({"asset": {"id": "text", "type": "text", "value":"new node from the hook"}})
                """) ?? JSValue()))
        }

        plugin.context = jsContext

        let context = SwiftUIPlayer.Context { jsContext ?? JSContext() }

        let player = SwiftUIPlayer(
            flow: .asyncNodeJson, plugins: [ReferenceAssetsPlugin(), plugin], context: context)

        ViewHosting.host(view: player)

        let viewExpectation = player.inspection.inspect(after: 0.5) { view in
            _ = try view.vStack().first?.anyView().find(text: "new node from the hook")
        }

        wait(for: [handlerExpectation, viewExpectation], timeout: 1)
    }
}

extension String {
    static let asyncNodeJson = """
     {
       "id": "generated-flow",
       "views": [
         {
           "id": "collection",
           "type": "collection",
           "values": [
             {
               "asset": {
                 "id": "action",
                 "type": "action",
                 "exp": "{{count}} = {{count}} + 1",
                 "label": {
                   "asset": {
                     "id": "test",
                     "type": "text",
                     "value": "test"
                   }
                 }
               }
             },
             {
               "id": "async",
               "async": true
             }
           ]
         }
       ],
       "data": {
         "count": 0
       },
       "navigation": {
         "BEGIN": "FLOW_1",
         "FLOW_1": {
           "startState": "VIEW_1",
           "VIEW_1": {
             "state_type": "VIEW",
             "ref": "collection",
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
}
