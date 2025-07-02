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

    func testErrorContentFlow() {
        openFlow("Error Content Flow")

        let button1 = app.buttons["first_view"].firstMatch
        waitFor(button1)
        button1.tap()

        let button2 = app.buttons["second_view"].firstMatch
        waitFor(button2)
        button2.tap()

        let errorText = app.staticTexts["Unclosed brace after \"foo.bar..}\" at character 12"].firstMatch
        waitFor(errorText)
        XCTAssert(errorText.exists, "Error message did not appear")

        let retryButton = app.buttons["Retry"].firstMatch
        XCTAssert(retryButton.exists, "Retry button did not appear")
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
        resetButton.tap()

        waitFor(button1)
    }
}
