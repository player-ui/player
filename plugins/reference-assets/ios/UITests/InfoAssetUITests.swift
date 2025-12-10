import Foundation
import XCTest

class InfoAssetUITests: BaseTestCase {
    func testInfoBasic() {
        openFlow("info basic")
        waitFor(app.buttons["next-action"])

        tap(app.buttons["next-action"])

        XCTAssertTrue(app.alerts["Flow Finished"].exists)

        XCTAssertTrue(app.alerts["Flow Finished"].staticTexts.element(boundBy: 1).label.contains("done"))

    }
}
