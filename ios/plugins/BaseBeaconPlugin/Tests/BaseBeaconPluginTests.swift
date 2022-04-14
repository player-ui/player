//
//  BaseBeaconPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/11/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI

class BPPlugin: JSBasePlugin {
    override open func setup(context: JSContext) {

    }
}

class BaseBeaconPluginTests: XCTestCase {
    func testBeaconPluginAppliesContextToPlugins() {
        let context = JSContext()!
        JSUtilities.polyfill(context)
        let bpp = BPPlugin(fileName: "", pluginName: "")

        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: [bpp]) { _ in }
        plugin.context = context

        XCTAssertNotNil(bpp.context)
    }

    func testBeaconFunction() {
        let context = JSContext()!
        JSUtilities.polyfill(context)

        let beaconed = expectation(description: "Beacon sent")

        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: []) { _ in beaconed.fulfill() }
        plugin.context = context

        plugin.beacon(assetBeacon: AssetBeacon(action: "action", element: "element", asset: BeaconableAsset(id: "id")))
        wait(for: [beaconed], timeout: 1)
    }
}
