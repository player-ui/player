import XCTest

class ActionAssetUITests: BaseTestCase {
    func testActionCounter() {
        openFlow("action counter")
        waitFor(app.buttons["action"])

        waitAndTap(app.buttons["action"])
        waitFor(app.buttons["action"])

        let buttonText = app.buttons["action"].label

        XCTAssertEqual(buttonText, "Clicked 1 times")
    }

    func testActionTransitionSuccess() {
        openFlow("action transition to end")
        waitFor(app.buttons["action-good"])

        waitAndTap(app.buttons["action-good"])

        waitFor(app.alerts["Flow Finished"])

        XCTAssertTrue(app.alerts["Flow Finished"].exists)

        XCTAssertTrue(app.alerts["Flow Finished"].staticTexts.element(boundBy: 1).label.contains("done"))
    }

    func testActionTransitionError() {
        openFlow("action transition to end")
        waitFor(app.buttons["action-bad"])

        waitAndTap(app.buttons["action-bad"])

        waitFor(app.alerts["Flow Finished"])

        XCTAssertTrue(app.alerts["Flow Finished"].exists)

        XCTAssertTrue(app.alerts["Flow Finished"].staticTexts.element(boundBy: 1).label.contains("Unclosed brace"))
    }
}
