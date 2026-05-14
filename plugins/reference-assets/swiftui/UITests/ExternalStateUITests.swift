import Foundation
import XCTest

class ExternalStateUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testExternalState() {
        openFlow("external-state external-state")
        let alert = app.alerts["FlowCompleted"]
        waitFor(alert)
        XCTAssertTrue(alert.staticTexts.element(boundBy: 1).label.contains("FWD"))
    }
}
