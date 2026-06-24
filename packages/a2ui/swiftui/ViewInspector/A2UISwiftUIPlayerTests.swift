import Foundation
import SwiftUI
import XCTest
@testable import PlayerUI
@testable import PlayerUIA2UIPreset
@testable import PlayerUISwiftUI

class A2UISwiftUIPlayerTests: XCTestCase {
    func testPreconfiguresAllA2UIAssets() {
        let player = A2UISwiftUIPlayer(
            flow: "",
            result: .constant(nil),
            context: .init()
        )

        // The A2UI plugin registers all 16 catalog assets.
        XCTAssertEqual(player.player.assetRegistry.registeredAssets.count, 16)
    }
}
