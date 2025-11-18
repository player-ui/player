import XCTest

class InputAssetUITests: BaseTestCase {
    func testBasicInput() {
        openFlow("input basic")
        let enteredValue = "Hello World"

        waitFor(app.textFields["input"])

        app.textFields["input"].firstMatch.tap()
        app.textFields["input"].firstMatch.typeText(enteredValue)
        app.textFields["input"].firstMatch.typeText("\n")

        waitFor(app.textFields["input"])

        let labelValue = app.textFields["input"].firstMatch.value as? String

        XCTAssertEqual(labelValue, enteredValue)
    }

    func testInputValidation() {
        openFlow("input validation")
        let enteredValue = "Hello World"

        waitFor(app.textFields["input-1"])

        app.textFields["input-1"].firstMatch.tap()
        app.textFields["input-1"].firstMatch.typeText(enteredValue)
        app.textFields["input-1"].firstMatch.typeText("\n")

        waitFor(app.textFields["input-1"])
        XCTAssertTrue(app.staticTexts["input-1-validation"].firstMatch.exists)

        app.textFields["input-1"].firstMatch.tap()
        app.textFields["input-1"].firstMatch.typeText("55")
        app.textFields["input-1"].firstMatch.typeText("\n")

        waitFor(app.textFields["input-1"])
        XCTAssertFalse(app.staticTexts["input-1-validation"].firstMatch.exists)
    }
}
