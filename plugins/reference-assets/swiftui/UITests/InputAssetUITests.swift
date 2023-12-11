import XCTest

class InputAssetUITests: BaseTestCase {
    func testBasicInput() {
        withEyes("input basic") { check in
            let enteredValue = "Hello World"

            waitFor(app.textFields["input"])
            check("Page Load")
            app.textFields["input"].firstMatch.tap()
            app.textFields["input"].firstMatch.typeText(enteredValue)
            app.textFields["input"].firstMatch.typeText("\n")

            waitFor(app.textFields["input"])

            check("Text Entered")

            let labelValue = app.textFields["input"].firstMatch.value as? String

            XCTAssertEqual(labelValue, enteredValue)
        }
    }

    func testInputValidation() {
        withEyes("input validation") { check in
            let enteredValue = "Hello World"

            waitFor(app.textFields["input-1"])

            check("Page Load")

            app.textFields["input-1"].firstMatch.tap()
            app.textFields["input-1"].firstMatch.typeText(enteredValue)
            app.textFields["input-1"].firstMatch.typeText("\n")

            waitFor(app.textFields["input-1"])
            XCTAssertTrue(app.staticTexts["input-1-validation"].firstMatch.exists)

            check("input 1 validation active")

            app.textFields["input-1"].firstMatch.tap()
            app.textFields["input-1"].firstMatch.typeText("55")
            app.textFields["input-1"].firstMatch.typeText("\n")

            waitFor(app.textFields["input-1"])
            XCTAssertFalse(app.staticTexts["input-1-validation"].firstMatch.exists)
            check("input 1 validation inactive")
        }
    }
}
