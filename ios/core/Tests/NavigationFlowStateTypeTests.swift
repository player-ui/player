import Foundation
import XCTest
@testable import PlayerUI

class NavigationFlowStateTypeTests: XCTestCase {

    func testKnownStateTypes() {
        let cases: [(String, NavigationFlowStateType)] = [
            ("VIEW", .view),
            ("ACTION", .action),
            ("ASYNC_ACTION", .asyncAction),
            ("FLOW", .flow),
            ("EXTERNAL", .external),
            ("END", .end)
        ]

        for (raw, expected) in cases {
            let stateType = NavigationFlowStateType(raw)
            XCTAssertEqual(stateType, expected)
            XCTAssertEqual(stateType.rawValue, raw)
        }
    }

    func testUnknownStateType() {
        let stateType = NavigationFlowStateType("SOME_NEW_TYPE")
        XCTAssertEqual(stateType, .unknown("SOME_NEW_TYPE"))
        XCTAssertEqual(stateType.rawValue, "SOME_NEW_TYPE")
    }
}
