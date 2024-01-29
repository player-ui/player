import Foundation
import XCTest

class InfoAssetUITests: BaseTestCase {
    func testInfoBasic() {
        openFlow("info basic")
        waitFor(app.buttons["next-action"])

        tap(app.buttons["next-action"])

        XCTAssertTrue(app.alerts["FlowFinished"].exists)

        XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("done"))

    }
}
