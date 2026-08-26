import Foundation
import XCTest

class ManagedPlayerUITests: BaseTestCase {
    func testSimpleFlow() {
        openFlow("Simple Flows")
        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)

        let completedText = app.staticTexts["Flow Completed"]
        waitFor(completedText)
        // tapAndAssertElementAppears(button2, expectedOutcome: completedText)
    }

    func testErrorContentFlow() {
        openFlow("Error Content Flow")

        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)
        button2.tap()

        let retryButton = app.buttons["Retry"].firstMatch
        // tapAndAssertElementAppears(button2, expectedOutcome: retryButton, timeout: 5)
        waitFor(retryButton)
        retryButton.tap()
        let errorText = app.staticTexts["Unclosed brace after \"foo.bar..}\" at character 12"]
            .firstMatch
        XCTAssert(errorText.exists, "Error message did not appear")
    }

    func testErrorAssetFlow() {
        openFlow("Error Asset Flow")
        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let errorText = app.staticTexts["PlayerUI.DecodingError.typeNotRegistered(type: \"error\")"]
            .firstMatch
        waitFor(errorText)

        let resetButton = app.buttons["Reset"]
        waitFor(resetButton)
        resetButton.tap()

        waitFor(button1)
    }

    func testReuseAlreadyLoadedFlow() {
        openFlow("Reuse already loaded flow")
        let button1 = app.buttons["action-end"].firstMatch
        waitFor(button1)
        button1.tap()

        // the same view should reload properly
        waitFor(button1)
    }

    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugin Demos"].firstMatch.tap()
    }
}
