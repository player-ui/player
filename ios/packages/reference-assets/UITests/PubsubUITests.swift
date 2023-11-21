import Foundation
import XCTest

class PubSubUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testPubsubPluginAction() {
        withEyes("pub sub basic") { check in
            check("pub sub basic loaded")

            XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("collection"))

            app.buttons["OK"].firstMatch.tap()

            let button = app.buttons["action"].firstMatch
            waitFor(button)
            button.tap()

            XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("Published: `some-event`"))

            XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("event published message"))

            check("pub sub event")
        }
    }
}
