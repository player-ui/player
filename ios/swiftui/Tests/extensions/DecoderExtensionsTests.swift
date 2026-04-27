//
//  DecoderExtensionsTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/5/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
import XCTest

class DecoderExtensionsTests: XCTestCase {
    func testNotAnAssetDecoderForSUIDecodeFunction() {
        let decoder = TestDecoder()

        let throwExpectation = XCTestExpectation()
        do {
            _ = try decoder.getSUIDecodeFunction()
            XCTFail("should have thrown error")
        } catch {
            throwExpectation.fulfill()
        }

        wait(for: [throwExpectation], timeout: 1)
    }
}
