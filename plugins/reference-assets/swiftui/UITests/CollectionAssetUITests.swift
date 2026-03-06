import XCTest

class CollectionAssetUITests: BaseTestCase {
    /// Verifies the collection-basic flow renders correctly with a label and two text values.
    func testBasicCollection() {
        openFlow("collection basic")
        waitFor(app.otherElements["view-1"])

        // Verify the optional label asset is rendered with the correct text
        XCTAssertTrue(app.staticTexts["view-1-label"].exists, "Label should be displayed")
        XCTAssertEqual(app.staticTexts["view-1-label"].label, "Collections are used to group assets.")

        // Verify both value assets in the collection are rendered
        let value1 = app.staticTexts["text-1"].label
        let value2 = app.staticTexts["text-2"].label

        XCTAssertEqual(value1, "This is the first item in the collection")
        XCTAssertEqual(value2, "This is the second item in the collection")
    }
}
