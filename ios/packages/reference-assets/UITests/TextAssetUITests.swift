import XCTest

class TextAssetUITests: BaseTestCase {
    func testBasicText() {
        openFlow("text basic")
        waitFor(app.staticTexts["text-1"])
        let text = app.staticTexts["text-1"].label
        XCTAssertEqual(text, "This is some text.")

        let label = app.staticTexts["text-2"]
        XCTAssertEqual(label.label, "This is some text that is a link")
    }
}
