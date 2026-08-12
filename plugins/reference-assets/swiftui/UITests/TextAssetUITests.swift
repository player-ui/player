import XCTest

class TextAssetUITests: BaseTestCase {
    func testBasicText() {
        openFlow("text basic")
        waitFor(app.staticTexts["values-0"])
        let text = app.staticTexts["values-0"].label
        XCTAssertEqual(text, "This is some text")

        let label = app.staticTexts["values-1"]
        XCTAssertEqual(label.label, "This is some text that is a link")
    }
}
