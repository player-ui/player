import XCTest
import EyesXCUI

class ActionAssetUITests: BaseTestCase {
    func testActionCounter() {
        withEyes("action counter") { eyes in
            waitFor(app.buttons["action"])
            eyes?.checkApp(withTag: "Page Load")

            tap(app.buttons["action"])
            waitFor(app.buttons["action"])

            let buttonText = app.buttons["action"].label

            eyes?.checkApp(withTag: "After Click")
            XCTAssertEqual(buttonText, "Clicked 1 times")
        }
    }

    func testActionTransitionSuccess() {
        withEyes("action transition to end", testName: "action transition to end - success") { eyes in
            waitFor(app.buttons["action-good"])
            eyes?.checkApp(withTag: "Page Load")

            tap(app.buttons["action-good"])

            waitFor(app.alerts["FlowFinished"])
            eyes?.checkApp(withTag: "After Click")
            XCTAssertTrue(app.alerts["FlowFinished"].exists)

            XCTAssertEqual(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label, "done")
        }
    }

    func testActionTransitionError() {
        withEyes("action transition to end", testName: "action transition to end - error") { eyes in
            waitFor(app.buttons["action-bad"])
            eyes?.checkApp(withTag: "Page Load")

            tap(app.buttons["action-bad"])

            waitFor(app.alerts["FlowFinished"])
            eyes?.checkApp(withTag: "After Click")
            XCTAssertTrue(app.alerts["FlowFinished"].exists)

            XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("Unclosed brace"))
        }
    }
}
