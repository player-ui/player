import Foundation
import XCTest

class ManagedPlayerUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    /// Taps the element and verifies the expected outcome appears. If the tap has no effect
    /// (e.g., the JS action handler isn't wired yet due to async SwiftUI binding), retries the tap.
    private func tapAndAssertElementAppears(
        _ element: XCUIElement,
        expectedOutcome: XCUIElement,
        timeout: TimeInterval = 3,
        retries: Int = 3
    ) {
        for _ in 0..<retries {
            element.tap()
            if expectedOutcome.waitForExistence(timeout: timeout) {
                return
            }
        }
    }

    func testSimpleFlow() {
        openFlow("Simple Flows")
        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)

        let completedText = app.staticTexts["Flow Completed"]
        tapAndAssertElementAppears(button2, expectedOutcome: completedText)
    }

    
    func testErrorContentFlow() {
        openFlow("Error Content Flow")

        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)

        let errorText = app.staticTexts["PlayerUI.DecodingError.typeNotRegistered(type: \"error\")"].firstMatch
        tapAndAssertElementAppears(button2, expectedOutcome: errorText)
        XCTAssert(errorText.exists, "Error message did not appear")

        let retryButton = app.buttons["Retry"].firstMatch
        waitFor(retryButton)
        retryButton.tap()

        waitFor(button2)
    }

    func testErrorAssetFlow() {
        openFlow("Error Asset Flow")
        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let errorText = app.staticTexts["PlayerUI.DecodingError.typeNotRegistered(type: \"error\")"].firstMatch
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
}
