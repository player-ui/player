//
//  PrintLoggerPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/26/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import JavaScriptCore
import XCTest
@testable import PlayerUI
@testable import PlayerUIPrintLoggerPlugin
@testable import PlayerUILogger
@testable import PlayerUITestUtilitiesCore

class PrintLoggerPluginTests: XCTestCase {
    func testPrintLogger() {
        let player = HeadlessPlayerImpl(plugins: [PrintLoggerPlugin(level: .trace)])
        XCTAssertEqual(LogLevel.trace, player.logger.logLevel)
        player.logger.t("Message")
        player.logger.d("Message")
        player.logger.i("Message")
        player.logger.w("Message")
        player.logger.e("Message")
    }
}
