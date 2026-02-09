import Foundation
import XCTest

class ManagedPlayerUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testSimpleFlow() {
        openFlow("Simple Flows")
        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)
        button2.tap()

        let completedText = app.staticTexts["Flow Completed"]
        waitFor(completedText)
    }

    // NOTE: This test flakes occassionally, but pretty rarely.
    func testErrorContentFlow() {
        openFlow("Error Content Flow")

        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)
        button2.tap()

        let errorText = app.staticTexts["Unclosed brace after \"foo.bar..}\" at character 12"].firstMatch
        waitFor(errorText, timeout: 10)
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
