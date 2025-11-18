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
        let logExpect = expectation(description: "Prefixed message logged")

        let player = HeadlessPlayerImpl(plugins: [PrintLoggerPlugin(level: .trace)])
        XCTAssertEqual(LogLevel.trace, player.logger.logLevel)

        player.logger.hooks.trace.tap(name: "test") { (message) in
            XCTAssertEqual("Message 1", (message as? [String])?.first)
            XCTAssertEqual("Message 2", (message as? [String])?[1])
            XCTAssertEqual("Message 3", (message as? [String])?[2])
            logExpect.fulfill()
        }
        
        player.logger.t("Message 1", "Message 2", "Message 3")
        player.logger.d("Message")
        player.logger.i("Message")
        player.logger.w("Message")
        player.logger.e("Message")

        wait(for: [logExpect], timeout: 1)
    }
}
