//
//  JSBasePluginTests.swift
//  PlayerUI_Tests
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
import XCTest

class JSBasePluginTests: XCTestCase {
    /// `PartialMatchFingerprintPlugin` is used as a concrete `JSBasePlugin` subclass;
    /// its own matching behavior isn't under test here, only `teardown()` itself.
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
