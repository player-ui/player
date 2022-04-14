//
//  JSLoggerTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/26/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest

@testable import PlayerUI

class JSLoggerTests: XCTestCase {
    func testJSLogger() {
        let player = HeadlessPlayerImpl(plugins: [])
        player.logger.logLevel = .trace

        let traceExpect = expectation(description: "trace message logged")
        let debugExpect = expectation(description: "debug message logged")
        let infoExpect = expectation(description: "info message logged")
        let warningExpect = expectation(description: "warning message logged")
        let errorExpect = expectation(description: "error message logged")
        player.logger.hooks.trace.tap(name: "test") { message in
            guard message == "\"Message\"" else { return }
            traceExpect.fulfill()
        }
        player.logger.hooks.debug.tap(name: "test") { message in
            guard message == "\"Message\"" else { return }
            debugExpect.fulfill()
        }
        player.logger.hooks.info.tap(name: "test") { message in
            guard message == "\"Message\"" else { return }
            infoExpect.fulfill()
        }
        player.logger.hooks.warn.tap(name: "test") { message in
            guard message == "\"Message\"" else { return }
            warningExpect.fulfill()
        }
        player.logger.hooks.error.tap(name: "test") { message in
            guard message.0 == "\"Message\"" else { return }
            errorExpect.fulfill()
        }

        player.start(flow: FlowData.COUNTER, completion: {_ in})
        let state = player.state as? InProgressState
        state?.logger?.trace("Message")
        state?.logger?.debug("Message")
        state?.logger?.info("Message")
        state?.logger?.warn("Message")
        state?.logger?.error("Message")

        wait(for: [traceExpect, debugExpect, infoExpect, warningExpect, errorExpect], timeout: 3)
    }
}
