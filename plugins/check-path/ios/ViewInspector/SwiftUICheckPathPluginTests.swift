import Foundation
import XCTest
import SwiftUI
import ViewInspector
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUISwiftUICheckPathPlugin

class SwiftUICheckPathPluginTests: XCTestCase {
    func testContextAttachment() throws {
        let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [SwiftUICheckPathPlugin()])
        var baseView = CheckPathTestAssetView()

        let appear = baseView.on(\.didAppear) { view in
            let value = try view.actualView().checkPath
            guard let value = value else { return }
            XCTAssertEqual(value.getParentProp(id: "action-label"), "label")
            XCTAssertTrue(value.hasParentContext(id: "action-label", query: "action"))
            XCTAssertNotNil(value.getParentContext(id: "action-label", query: "action"))
        }

        guard let view: AnyView = player.hooks?.view.call(AnyView(baseView)) else {
            return XCTFail("no view returned from hook")
        }

        ViewHosting.host(view: view)

        wait(for: [appear], timeout: 2)
    }
}

private struct CheckPathTestAssetView: View {
    @Environment(\.checkPath) var checkPath

    // For Testing Purposes
    internal var didAppear: ((Self) -> Void)?

    var body: some View {
        Text(checkPath == nil ? "Not Found" : "Found").onAppear { didAppear?(self) }
    }
}
