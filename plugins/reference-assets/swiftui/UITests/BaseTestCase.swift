//
//  BaseTestCase.swift
//  PlayerUI_ExampleUITests
//
//  Created by Borawski, Harris on 4/3/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Combine
import Foundation
import PlayerUI
import PlayerUITestUtilities
import PlayerUITestUtilitiesCore
import XCTest

class BaseTestCase: AssetUITestCase {
    /// AssetCollectionView uses a List which wont register elements if they aren't on screen
    override func openFlow(_ mockName: String) {
        guard !app.buttons[mockName].exists else { return super.openFlow(mockName) }
        var attempts = 0
        while attempts < 5 {
            app.swipeUp()
            XCTWaiter.delay(ms: 1)
            if app.buttons[mockName].exists {
                break
            }
            attempts += 1
        }
        super.openFlow(mockName)
    }
}

extension XCTWaiter {
    @discardableResult
    static func delay(ms duration: TimeInterval = 0.5) -> XCTWaiter.Result {
        wait(for: [XCTestExpectation(description: "Fixed Delay")], timeout: duration)
    }
}
