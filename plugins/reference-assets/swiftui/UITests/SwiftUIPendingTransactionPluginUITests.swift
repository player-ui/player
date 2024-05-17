import Foundation
import XCTest

class SwiftUIPendingTransactionPluginUITests: BaseTestCase {
    override func navigateToAssetCollection() {
        app.otherElements.buttons["Plugins + Managed Player"].firstMatch.tap()
    }

    func testInputAssetPendingTransaction() {
        openFlow("input asset pending transaction")

        waitFor(app.alerts.buttons["OK"].firstMatch)

        app.alerts.buttons["OK"].firstMatch.tap()

        var enteredValue = "-1"

        let input = app.textFields["input-required"]
        waitFor(input)

        input.tap()
        input.typeText(enteredValue)

        let button = app.buttons["action-1"].firstMatch

        button.tap()
        XCTAssertTrue(app.staticTexts["Must be at least 1"].firstMatch.exists)

        input.typeText(XCUIKeyboardKey.delete.rawValue)
        input.typeText(XCUIKeyboardKey.delete.rawValue)

        enteredValue = "1"

        input.tap()
        input.typeText(enteredValue)

        button.tap()

        XCTAssertTrue(app.alerts["Info"].staticTexts.element(boundBy: 1).label.contains("view-2"))

        app.buttons["OK"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["You made it!"].firstMatch.exists)
    }
}
