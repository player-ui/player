import Foundation
import XCTest

class InfoAssetUITests: BaseTestCase {
    func testInfoBasic() {
        openFlow("info basic")
        waitFor(app.buttons["info-view-actions-0"])

        tap(app.buttons["info-view-actions-0"])

        XCTAssertTrue(app.alerts["Flow Finished"].exists)

        XCTAssertTrue(app.alerts["Flow Finished"]
            .staticTexts
            .element(boundBy: 1)
            .label
            .contains("DONE"))
    }
}
