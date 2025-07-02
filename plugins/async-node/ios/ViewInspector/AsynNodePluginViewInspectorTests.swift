//
//  AsyncNodePluginTests.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-02-05.
//

import Foundation
import XCTest
import SwiftUI
import JavaScriptCore
import ViewInspector

@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUIAsyncNodePlugin

extension Inspection: InspectionEmissary { }

class AsyncNodePluginViewInspectorTests: XCTestCase {
    @MainActor func testAsyncNodeWithSwiftUIPlayerUsingJSValue() throws {
        let handlerExpectation = XCTestExpectation(description: "handler called")
        let jsContext = JSContext()

        let asyncNodePluginPlugin = AsyncNodePluginPlugin()

        let plugin = AsyncNodePlugin(plugins: [asyncNodePluginPlugin]) { _,_ in
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
