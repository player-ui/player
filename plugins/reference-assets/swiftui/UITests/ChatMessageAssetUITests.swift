 import XCTest

 class ChatMessageAssetUITests: BaseTestCase {
     func testChatMessage() {
         openFlow("chat message basic")
         waitFor(app.otherElements["collection-async-1"])
         let value1 = app.staticTexts["text"].label

         XCTAssertEqual(value1, "chat message")
     }
 }
