//
//  ValidationTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 6/17/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
import SwiftUI
@testable import PlayerUI

class ValidationTests: SwiftUIAssetUnitTestCase {
    func testErrorValidation() {
        let validation = """
        {
          "type": "required",
          "severity": "error",
          "message": "A value is required"
        }
        """

        guard let val = try? JSONDecoder().decode(ValidationData.self, from: validation.data(using: .utf8)!) else {
            return XCTFail("could not get validation")
        }
        XCTAssertEqual(val.severity, ValidationSeverity.error)
        XCTAssertEqual(val.severity.textColor, Color(red: 0.835, green: 0.169, blue: 0.118))
        XCTAssertEqual(val.severity.color, Color(red: 0.835, green: 0.169, blue: 0.118))
    }

    func testWarningValidation() {
        let validation = """
        {
          "type": "required",
          "severity": "warning",
          "message": "A value is required"
        }
        """
        let dismissExpect = XCTestExpectation(description: "dismiss called")

        guard var val = try? JSONDecoder().decode(ValidationData.self, from: validation.data(using: .utf8)!) else {
            return XCTFail("could not get validation")
        }
        val.dismiss = getWrappedFunction {
            dismissExpect.fulfill()
        }
        XCTAssertEqual(val.severity, ValidationSeverity.warning)
        XCTAssertEqual(val.severity.textColor, Color(red: 0.000, green: 0.000, blue: 0.000))
        XCTAssertEqual(val.severity.color, Color(red: 0.976, green: 0.341, blue: 0.000))

        val.dismiss?()

        wait(for: [dismissExpect], timeout: 1)
    }
}
