import XCTest

class TextAssetUITests: BaseTestCase {
    func testBasicText() {
        withEyes("text basic") { check in
            waitFor(app.staticTexts["text-1"])
            check("Page Load")
            let text = app.staticTexts["text-1"].label
            XCTAssertEqual(text, "This is some text.")

            let label = app.staticTexts["text-2"]
            XCTAssertEqual(label.label, "This is some text that is a link")
        }
    }
}
