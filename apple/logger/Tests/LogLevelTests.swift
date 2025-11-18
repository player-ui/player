//
//  LogLevelTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/26/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
@testable import PlayerUILogger

class LogLevelTests: XCTestCase {
    func testShouldLog() {
        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .trace), true)
        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .debug), false)
        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .info), false)
        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .warning), false)
        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .error), false)

        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .trace), true)
        XCTAssertEqual(LogLevel.debug.shouldLog(currentLevel: .debug), true)
        XCTAssertEqual(LogLevel.debug.shouldLog(currentLevel: .info), false)
        XCTAssertEqual(LogLevel.debug.shouldLog(currentLevel: .warning), false)
        XCTAssertEqual(LogLevel.debug.shouldLog(currentLevel: .error), false)

        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .trace), true)
        XCTAssertEqual(LogLevel.info.shouldLog(currentLevel: .debug), true)
        XCTAssertEqual(LogLevel.info.shouldLog(currentLevel: .info), true)
        XCTAssertEqual(LogLevel.info.shouldLog(currentLevel: .warning), false)
        XCTAssertEqual(LogLevel.info.shouldLog(currentLevel: .error), false)

        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .trace), true)
        XCTAssertEqual(LogLevel.warning.shouldLog(currentLevel: .debug), true)
        XCTAssertEqual(LogLevel.warning.shouldLog(currentLevel: .info), true)
        XCTAssertEqual(LogLevel.warning.shouldLog(currentLevel: .warning), true)
        XCTAssertEqual(LogLevel.warning.shouldLog(currentLevel: .error), false)

        XCTAssertEqual(LogLevel.trace.shouldLog(currentLevel: .trace), true)
        XCTAssertEqual(LogLevel.error.shouldLog(currentLevel: .debug), true)
        XCTAssertEqual(LogLevel.error.shouldLog(currentLevel: .info), true)
        XCTAssertEqual(LogLevel.error.shouldLog(currentLevel: .warning), true)
        XCTAssertEqual(LogLevel.error.shouldLog(currentLevel: .error), true)
    }
}
