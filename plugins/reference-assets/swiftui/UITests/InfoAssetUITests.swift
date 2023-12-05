import Foundation
import XCTest

class InfoAssetUITests: BaseTestCase {
    func testInfoBasic() {
        withEyes("info basic") { check in
            waitFor(app.buttons["next-action"])

            check("Page Load")

            tap(app.buttons["next-action"])

            check("Flow End")
        }
    }
}
