//
//  JSBasePluginTests.swift
//  PlayerUI_Tests
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
import XCTest

class JSBasePluginTests: XCTestCase {
    /// Verifies `JSBasePlugin.teardown()` releases `pluginRef` and `context`, so calls into JS
    /// after teardown safely no-op. Uses `PartialMatchFingerprintPlugin` as a concrete subclass.
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
