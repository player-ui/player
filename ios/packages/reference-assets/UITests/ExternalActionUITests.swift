import Foundation
import XCTest

class ExternalActionUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testExternalAction() {
        withEyes("external-action external-action") { check in
            let alert = app.alerts["FlowFinished"]
            waitFor(alert)
            XCTAssertTrue(alert.staticTexts.element(boundBy: 1).label.contains("FWD"))

            check("External action alert")
        }
    }
}
