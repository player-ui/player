import Foundation
import XCTest

class ManagedPlayerUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testSimpleFlow() {
        withEyes("Simple Flows") { check in
            check("First view")
            let button1 = app.buttons["first_view"].firstMatch
            waitFor(button1)
            button1.tap()

            let button2 = app.buttons["second_view"].firstMatch
            waitFor(button2)
            button2.tap()

            let completedText = app.staticTexts["Flow Completed"]

            waitFor(completedText)

            check("Flow Completed")
        }
    }

    func testErrorContentFlow() {

        withEyes("Error Content Flow") { check in
            check("First view")
            let button1 = app.buttons["first_view"].firstMatch
            waitFor(button1)
            button1.tap()

            let button2 = app.buttons["second_view"].firstMatch

            waitFor(button2)
            button2.tap()

            let errorText = app.staticTexts["Unclosed brace after \"foo.bar..}\" at character 12"].firstMatch
            waitFor(errorText)
            check("Content Error")

            let retryButton = app.buttons["Retry"].firstMatch
            retryButton.tap()

            waitFor(button2)
            check("Reload Second View")
        }
    }

    func testErrorAssetFlow() {
        withEyes("Error Asset Flow") { check in
            check("First view")
            let button1 = app.buttons["first_view"].firstMatch
            waitFor(button1)
            button1.tap()

            let errorText = app.staticTexts["PlayerUI.DecodingError.typeNotRegistered(type: \"error\")"].firstMatch

            waitFor(errorText)

            check("Asset Error")

            let resetButton = app.buttons["Reset"]
            resetButton.tap()

            waitFor(button1)

            check("Back to First view")
        }
    }
}
