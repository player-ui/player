import XCTest

class ActionAssetUITests: BaseTestCase {
    func testActionCounter() {
        openFlow("action counter")
        waitFor(app.buttons["action"])

        tap(app.buttons["action"])
        waitFor(app.buttons["action"])

        let buttonText = app.buttons["action"].label

        XCTAssertEqual(buttonText, "Clicked 1 times")
    }

    func testActionTransitionSuccess() {
        openFlow("action transition to end")
        waitFor(app.buttons["action-good"])

        tap(app.buttons["action-good"])

        waitFor(app.alerts["FlowFinished"])

        XCTAssertTrue(app.alerts["FlowFinished"].exists)

        XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("done"))
    }

    func testActionTransitionError() {
        openFlow("action transition to end")
        waitFor(app.buttons["action-bad"])

        tap(app.buttons["action-bad"])

        waitFor(app.alerts["FlowFinished"])

        XCTAssertTrue(app.alerts["FlowFinished"].exists)

        XCTAssertTrue(app.alerts["FlowFinished"].staticTexts.element(boundBy: 1).label.contains("Unclosed brace"))
    }
}
