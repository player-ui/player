//
//  AsyncNodePluginTests.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-02-05.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector
import JavaScriptCore
@testable import PlayerUI

class AsyncNodePluginTests: SwiftUIAssetUnitTestCase {

    func testConstruction() {
        let context = JSContext()
        let plugin = AsyncNodePlugin { _ in
            return .singleNode(.concrete(JSValue()))
        }
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
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

    func testAsyncNodeWithAnotherAsyncNodeDelay() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")

        let context = JSContext()

        var count = 0

        let resolveHandler: AsyncHookHandler = { _ in
            handlerExpectation.fulfill()

            sleep(3)
            return .singleNode(.concrete(context?.evaluateScript("""
                    ([
                        {"asset": {"id": "text", "type": "text", "value":"new node from the hook 1"}}
                       ])
                    """) ?? JSValue()))
        }

        let plugin = AsyncNodePlugin(resolveHandler)

        plugin.context = context

        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())

        let textExpectation = XCTestExpectation(description: "newText1 found")

        var expectedMultiNode1Text: String = ""

        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1

                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText1 was not a string") }

                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }
                }
            }
        })

        player.start(flow: .asyncNodeJson, completion: {_ in})

        wait(for: [handlerExpectation, textExpectation], timeout: 5)

        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")
    }

    func testReplaceAsyncNodeWithChainedMultiNodes() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")

        let context = JSContext()
        var count = 0

        let resolve: AsyncHookHandler = { _ in
            handlerExpectation.fulfill()

            if count == 1 {
                return .multiNode([
                    ReplacementNode.concrete(context?.evaluateScript("""
                        (
                            {"asset": {"id": "text", "type": "text", "value":"1st value in the multinode"}}
                           )
                        """) ?? JSValue()),
                    ReplacementNode.encodable(AsyncNode(id: "id"))])
            } else if count == 2 {
                return .multiNode([
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text-2", type: "text", value: "2nd value in the multinode"))),
                    ReplacementNode.encodable(AsyncNode(id: "id-1"))])
            } else if count == 3 {
                return .singleNode(ReplacementNode.encodable(
                    AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "3rd value in the multinode"))
                ))
            }

            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }

        let plugin = AsyncNodePlugin(resolve)

        plugin.context = context

        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())

        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")
        let textExpectation3 = XCTestExpectation(description: "newText found")

        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""
        var expectedMultiNode3Text: String = ""

        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1

                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }

                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }

                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(2)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }

                        expectedMultiNode2Text = textString2

                        textExpectation2.fulfill()
                    }

                    if count == 4 {
                        let newText3 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(3)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString3 = newText3?.toString() else { return XCTFail("newText was not a string") }

                        expectedMultiNode3Text = textString3
                        textExpectation3.fulfill()
                    }
                }
            }
        })

        player.start(flow: .asyncNodeJson, completion: { _ in})

        wait(for: [handlerExpectation, textExpectation], timeout: 5)

        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "1st value in the multinode")

        wait(for: [textExpectation2], timeout: 6)

        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "2nd value in the multinode")

        wait(for: [textExpectation3], timeout: 7)

        XCTAssert(count == 4)
        XCTAssertEqual(expectedMultiNode3Text, "3rd value in the multinode")
    }

    func testAsyncNodeReplacementWithChainedMultiNodesSinglular() {
        let handlerExpectation = XCTestExpectation(description: "first data did not change")

        let context = JSContext()

        var count = 0

        let resolve: AsyncHookHandler = { _ in
            handlerExpectation.fulfill()

            if count == 1 {
                return .multiNode([
                    ReplacementNode.encodable(AssetPlaceholderNode(asset: PlaceholderNode(id: "text", type: "text", value: "new node from the hook 1"))),
                    ReplacementNode.encodable(AsyncNode(id: "id"))
                ])
            } else if count == 2 {
                return .singleNode(.concrete(context?.evaluateScript("""
                (
                    {"asset": {"id": "text", "type": "text", "value":"new node from the hook 2"}}
                   )
                """) ?? JSValue()))
            }

            return .singleNode(ReplacementNode.concrete(context?.evaluateScript("") ?? JSValue()))
        }

        let plugin = AsyncNodePlugin(resolve)

        plugin.context = context

        let player = HeadlessPlayerImpl(plugins: [ReferenceAssetsPlugin(), plugin], context: context ?? JSContext())

        let textExpectation = XCTestExpectation(description: "newText found")
        let textExpectation2 = XCTestExpectation(description: "newText found")

        var expectedMultiNode1Text: String = ""
        var expectedMultiNode2Text: String = ""

        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    count += 1

                    if count == 2 {
                        let newText1 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(1)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString1 = newText1?.toString() else { return XCTFail("newText was not a string") }

                        expectedMultiNode1Text = textString1
                        textExpectation.fulfill()
                    }

                    if count == 3 {
                        let newText2 = val
                            .objectForKeyedSubscript("values")
                            .objectAtIndexedSubscript(2)
                            .objectForKeyedSubscript("asset")
                            .objectForKeyedSubscript("value")
                        guard let textString2 = newText2?.toString() else { return XCTFail("newText was not a string") }

                        expectedMultiNode2Text = textString2
                        textExpectation2.fulfill()

                    }
                }
            }
        })

        player.start(flow: .asyncNodeJson, completion: { _ in})

        wait(for: [handlerExpectation, textExpectation], timeout: 5)

        XCTAssert(count == 2)
        XCTAssertEqual(expectedMultiNode1Text, "new node from the hook 1")

        wait(for: [textExpectation2], timeout: 5)

        XCTAssert(count == 3)
        XCTAssertEqual(expectedMultiNode2Text, "new node from the hook 2")
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

struct PlaceholderNode: Codable, Equatable, AssetData {
    public var id: String
    public var type: String
    var value: String?

    public init(id: String, type: String, value: String? = nil) {
        self.id = id
        self.type = type
        self.value = value
    }
}
