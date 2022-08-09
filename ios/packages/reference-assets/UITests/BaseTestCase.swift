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

    override func setUp() {
        continueAfterFailure = false
        eyes.serverURL = "https://intuiteyesapi.applitools.com"

        if let id = ProcessInfo.processInfo.environment["APPLITOOLS_BATCH_ID"], id != "", id != "$(APPLITOOLS_BATCH_ID)" {
            print("Got APPLITOOLS_BATCH_ID from environment: \(id)")
            let info = BatchInfo(name: "iOS@\(id)")
            info?.batchId = id
            eyes.batch = info
        } else {
            print("Unable to fetch APPLITOOLS_BATCH_ID from environment")
            let info = BatchInfo(name: "iOS@local")
            info?.batchId = "local"
            eyes.batch = info
        }
        if let key = ProcessInfo.processInfo.environment["APPLITOOLS_API_KEY"], key != "", key != "$(APPLITOOLS_API_KEY)" {
            print("Got APPLITOOLS_API_KEY from environment: \(key)")
            eyes.apiKey = key
            self.key = key
        } else {
            print("Unable to fetch APPLITOOLS_API_KEY from environment")
        }

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

    func withEyes(_ mockName: String, testName: String? = nil, body: (Eyes?) -> Void) {
        openFlow(mockName)
        guard key != nil else { return body(nil) }
        eyes.open(withApplicationName: "iOS PlayerUI Demo", testName: "\(testName ?? mockName)")
        body(eyes)
    }

    func withOutEyes(_ mockName: String, body: () -> Void) {
        openFlow(mockName)
        body()
    }
}

extension Eyes {
    func checkApp(withTag tag: String) {
        if #available(iOS 13, *) {
            self.check(withTag: "[iOS] \(tag)", andSettings: Target.window().statusBarExists(true))
        } else {
            self.checkWindow(withTag: tag)
        }
    }
}
