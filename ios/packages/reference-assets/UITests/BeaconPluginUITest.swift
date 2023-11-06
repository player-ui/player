import Foundation
import XCTest

class BeaconPluginUITests: BaseTestCase {
    func testBeaconPluginAction() {
        withEyes("beacon beacon action") { check in
            check("beacon action loaded")
            let button = app.buttons["action"].firstMatch
            waitFor(button)
            button.tap()
            button.tap()

            app.buttons["action-end"].firstMatch.tap()
            waitFor(app.alerts["FlowFinished"])

            XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("Click count: 1"))
            XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("Click count: 2"))
            XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("some-data"))
            
            check("Event published alert")
        }
    }
}
