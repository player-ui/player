//
//  ReferenceAssetsPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 4/17/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI
@testable import PlayerUITestUtilities
import XCTest

class SwiftUIReferenceAssetsPluginTests: XCTestCase {
    func testReferenceAssetsPluginConstructs() throws {
        let context = try XCTUnwrap(JSContext())

        let plugin = ReferenceAssetsPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }

    func testReferenceAssetRegistration() {
        let player = SwiftUIPlayer(flow: "", plugins: [ReferenceAssetsPlugin()])

        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 5)
    }
}
