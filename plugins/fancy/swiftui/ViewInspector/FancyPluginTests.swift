 import Foundation
 import XCTest
 import SwiftUI
 import ViewInspector
 @testable import PlayerUI
 @testable import PlayerUIInternalTestUtilities
 @testable import PlayerUISwiftUI
 @testable import PlayerUIFancyPlugin

 @MainActor
 class SwiftUIFancyPluginTests: XCTestCase {
     func testHasIsFancyTrueAsDefault() throws {
         let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [FancyPlugin()])
         var baseView = TestView()

         let appear = baseView.on(\.didAppear) { view in
             let isFancy = try view.actualView().isFancy
             XCTAssert(isFancy)
         }

         guard let view: AnyView = player.hooks?.view.call(AnyView(baseView)) else {
             return XCTFail("no view returned from hook")
         }
         ViewHosting.host(view: view)
         wait(for: [appear], timeout: 2)
     }

     /// Test setting isFancy to false
     func testHasIsFancyFalse() {
         let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [FancyPlugin(isFancy: false)])
         var baseView = TestView()

         let appear = baseView.on(\.didAppear) { view in
             let isFancy = try view.actualView().isFancy
             XCTAssertFalse(isFancy)
         }

         guard let view: AnyView = player.hooks?.view.call(AnyView(baseView)) else {
             return XCTFail("no view returned from hook")
         }
         ViewHosting.host(view: view)
         wait(for: [appear], timeout: 2)
     }
 }

 private struct TestView: View {
     @Environment(\.isFancy) var isFancy

     // For Testing Purposes
     internal var didAppear: ((Self) -> Void)?

     var body: some View {
         Text(isFancy ? "Fancy" : "Not Fancy").onAppear { didAppear?(self) }
     }
 }
