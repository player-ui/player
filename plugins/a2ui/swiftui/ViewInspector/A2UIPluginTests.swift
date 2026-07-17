import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIA2UI
@testable import PlayerUISwiftUI
import XCTest

class A2UIPluginTests: XCTestCase {
    func testA2UIPluginConstructs() throws {
        let context = try XCTUnwrap(JSContext())

        let plugin = A2UIPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }

    func testRegistersAllAssets() {
        let player = SwiftUIPlayer(flow: "", plugins: [A2UIPlugin()])

        // Row, Column, List, Text, Image, Icon, Divider, Button, TextField,
        // CheckBox, Slider, DateTimeInput, ChoicePicker, Card, Modal, Tabs
        XCTAssertEqual(player.assetRegistry.registeredAssets.count, 16)
    }
}
