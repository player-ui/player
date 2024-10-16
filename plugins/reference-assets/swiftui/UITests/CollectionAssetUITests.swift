import XCTest

class CollectionAssetUITests: BaseTestCase {
    func testBasicCollection() {
        openFlow("collection basic")
        waitFor(app.otherElements["view-1"])
        let value1 = app.staticTexts["text-1"].label
        let value2 = app.staticTexts["text-2"].label

        XCTAssertEqual(value1, "This is the first item in the collection")
        XCTAssertEqual(value2, "This is the second item in the collection")
    }
}
