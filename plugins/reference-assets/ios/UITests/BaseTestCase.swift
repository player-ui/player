//
//  BaseTestCase.swift
//  PlayerUI_ExampleUITests
//
//  Created by Borawski, Harris on 4/3/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import EyesXCUI
import PlayerUI
import Combine

class BaseTestCase: AssetUITestCase {
    private var eyes = Eyes()
    var key: String?

    func envOrDefault(_ key: String, fallback: String = "local") -> String {
        guard let value = fromEnv(key) else {
            print("Unable to fetch \(key) from the environment. Using fallback value: \(fallback)")
            return fallback
        }
        return value
    }

    func fromEnv(_ key: String) -> String? {
        guard
            let value = ProcessInfo.processInfo.environment[key],
            !value.isEmpty,
            value != "$(\(key))"
        else {
            return nil
        }
        return value
    }

    override func setUp() {
        continueAfterFailure = false
        eyes.serverURL = "https://intuiteyesapi.applitools.com"

        let prNumber = envOrDefault("APPLITOOLS_PR_NUMBER")
        let batchId = envOrDefault("APPLITOOLS_BATCH_ID")
        if let key = fromEnv("APPLITOOLS_API_KEY") {
            eyes.apiKey = key
            self.key = key
        } else {
            print("Unable to fetch APPLITOOLS_API_KEY from environment")
        }

        let info = BatchInfo(name: "reference-assets@\(prNumber)")
        info?.batchId = batchId
        eyes.addProperty("platform", value: "ios")
        eyes.batch = info

        eyes.configuration.appName = "iOS Reference Assets"

        super.setUp()
    }

    override func tearDown() {
        super.tearDown()
        guard key != nil else { return }
        do {
            try eyes.close()
        } catch {
            eyes.abortIfNotClosed()
        }
    }

    func withEyes(_ mockName: String, testName: String? = nil, body: (ApplitoolsCheck) -> Void) {
        openFlow(mockName)
        guard key != nil else { return body({ _ in }) }
        eyes.open(withApplicationName: "iOS Reference Assets", testName: "\(testName ?? mockName)")
        body({ tag in
            XCTWaiter.delay()
            eyes.checkApp(withTag: tag)
        })
    }

    func withOutEyes(_ mockName: String, body: () -> Void) {
        openFlow(mockName)
        body()
    }

    public typealias ApplitoolsCheck = (String) -> Void

    // AssetCollectionView uses a List which wont register elements if they aren't on screen
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

extension Eyes {
    func checkApp(withTag tag: String) {
        self.check(withTag: "[iOS] \(tag)", andSettings: Target.window().statusBarExists(true))
    }
}

extension XCTWaiter {
    @discardableResult
    static func delay(ms duration: TimeInterval = 0.5) -> XCTWaiter.Result {
        wait(for: [XCTestExpectation(description: "Fixed Delay")], timeout: duration)
    }
}
