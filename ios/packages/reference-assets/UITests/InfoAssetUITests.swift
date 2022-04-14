import Foundation
import XCTest

class InfoAssetUITests: BaseTestCase {
    func testInfoBasic() {
        withEyes("info basic") { eyes in
            waitFor(app.buttons["next-action"])

            eyes?.checkApp(withTag: "Page Load")

            tap(app.buttons["next-action"])

            eyes?.checkApp(withTag: "Flow End")
        }
    }
}
