import Foundation
import XCTest

class PubSubUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testPubsubPluginAction() {
        openFlow("pub sub basic")
        XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("action"))

        app.buttons["OK"].firstMatch.tap()

        let button = app.buttons["action"].firstMatch
        waitFor(button)
        button.tap()

        XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("Published: `some-event`"))

        XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("event published message"))
    }
}
