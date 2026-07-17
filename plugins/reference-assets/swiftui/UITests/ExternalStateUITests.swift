import Foundation
import XCTest

class ExternalStateUITests: BaseTestCase {
    func testExternalState() {
        openFlow("external-state external-state")
        let alert = app.alerts["FlowCompleted"]
        waitFor(alert)
        XCTAssertTrue(alert.staticTexts.element(boundBy: 1).label.contains("FWD"))
    }

    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }
}
