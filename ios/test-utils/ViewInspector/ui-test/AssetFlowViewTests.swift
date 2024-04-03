//
//  AssetFlowViewTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/15/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector

@testable import PlayerUI
@testable import PlayerUICommonTypesPlugin
@testable import PlayerUIBaseBeaconPlugin
@testable import PlayerUIBeaconPlugin
@testable import PlayerUIReferenceAssets
@testable import PlayerUITestUtilities
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUISwiftUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIInternalTestUtilities

class AssetFlowViewTests: XCTestCase {
  override func setUp() {
        XCUIApplication().terminate()
    }
    func testVersionBodies() throws {
        let flow = FlowData.COUNTER

        let view = AssetFlowView(
            flow: flow,
            plugins: [
                ReferenceAssetsPlugin(),
                BeaconPlugin<DefaultBeacon> {_ in},
                CommonTypesPlugin()
            ]
        ) { _ in
        }
        ViewHosting.host(view: view)

        _ = try view.inspect().scrollView().view(SwiftUIPlayer.self)

        ViewHosting.expel()
    }

    // swiftlint:disable function_body_length
    func testAssetFlowView() throws {
        let flow = """
        {
          "id": "generated-flow",
          "views": [
            {
              "id": "collection",
              "type": "collection",
              "values": [
                {
                  "asset": {
                    "id": "action-good",
                    "type": "action",
                    "value": "Next",
                    "label": {
                      "asset": {
                        "id": "action-good-label",
                        "type": "text",
                        "value": "End the flow (success)"
                      }
                    }
                  }
                },
                {
                  "asset": {
                    "id": "action-bad",
                    "type": "action",
                    "exp": "{{foo.bar..}",
                    "label": {
                      "asset": {
                        "id": "action-bad-label",
                        "type": "text",
                        "value": "End the flow (error)"
                      }
                    }
                  }
                }
              ]
            }
          ],
          "data": {},
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

        let transitioned = expectation(description: "Transitioned")
        transitioned.assertForOverFulfill = false
        let view = AssetFlowView(
            flow: flow,
            plugins: [
                ReferenceAssetsPlugin(),
                BeaconPlugin<DefaultBeacon> {_ in},
                CommonTypesPlugin(),
                ForceTransitionPlugin()
            ]
        ) { _ in
            transitioned.fulfill()
        }
        ViewHosting.host(view: view)

        wait(for: [transitioned], timeout: 2)
        ViewHosting.expel()
    }
}

class ForceTransitionPlugin: NativePlugin {
    var pluginName: String = "ForceTransition"

    func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { _ in
                    guard let state = player.state as? InProgressState else { return }
                    state.controllers?.flow.transition(with: "Next")
                }
            }
        }
    }
}
