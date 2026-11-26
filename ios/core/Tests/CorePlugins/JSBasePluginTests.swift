//
//  JSBasePluginTests.swift
//  PlayerUI_Tests
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
import XCTest

class JSBasePluginTests: XCTestCase {
    /// `JSBasePlugin.teardown()` sets `pluginRef` and `context` to nil, so later calls into JS
    /// return early. Uses `PartialMatchFingerprintPlugin` as a concrete subclass.
    func testTeardownReleasesPluginRefAndContext() {
        let context = JSContext()
        let plugin = PartialMatchFingerprintPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
        XCTAssertNotNil(plugin.context)

        plugin.teardown()

        XCTAssertNil(plugin.pluginRef, "teardown() must release pluginRef")
        XCTAssertNil(plugin.context, "teardown() must release context")
    }
}
