import Foundation
import XCTest

class ExternalActionUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testExternalAction() {
        openFlow("external-action external-action")
        let alert = app.alerts["FlowCompleted"]
        waitFor(alert)
        XCTAssertTrue(alert.staticTexts.element(boundBy: 1).label.contains("FWD"))
    }
}
