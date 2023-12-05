import XCTest
import EyesXCUI

class ActionAssetUITests: BaseTestCase {
    func testActionCounter() {
        withEyes("action counter") { check in
            waitFor(app.buttons["action"])
            check("Page Load")

            tap(app.buttons["action"])
            waitFor(app.buttons["action"])

            let buttonText = app.buttons["action"].label

            check("After Click")
            XCTAssertEqual(buttonText, "Clicked 1 times")
        }
    }

    func testActionTransitionSuccess() {
        withEyes("action transition to end", testName: "action transition to end - success") { check in
            waitFor(app.buttons["action-good"])
            check("Page Load")

            tap(app.buttons["action-good"])

            waitFor(app.alerts["FlowFinished"])
            check("After Click")
            XCTAssertTrue(app.alerts["FlowFinished"].exists)

            XCTAssertEqual(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label, "done")
        }
    }

    func testActionTransitionError() {
        withEyes("action transition to end", testName: "action transition to end - error") { check in
            waitFor(app.buttons["action-bad"])
            check("Page Load")

            tap(app.buttons["action-bad"])

            waitFor(app.alerts["FlowFinished"])
            check("After Click")
            XCTAssertTrue(app.alerts["FlowFinished"].exists)

            XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("Unclosed brace"))
        }
    }
}
