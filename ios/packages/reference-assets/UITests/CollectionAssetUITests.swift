import XCTest

class CollectionAssetUITests: BaseTestCase {
    func testBasicCollection() {
        withEyes("collection basic") { check in
            waitFor(app.otherElements["view-1"])
            check("Page Load")
            let value1 = app.staticTexts["text-1"].label
            let value2 = app.staticTexts["text-2"].label

            XCTAssertEqual(value1, "This is the first item in the collection")
            XCTAssertEqual(value2, "This is the second item in the collection")
        }
    }
}
