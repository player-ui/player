//
//  BeaconPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/12/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import SwiftUI
import ViewInspector
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUIBaseBeaconPlugin
@testable import PlayerUIBeaconPlugin

class BeaconPluginTests: XCTestCase {
    func testContextAttachment() throws {
        let player = SwiftUIPlayer(flow: "", plugins: [BeaconPlugin<DefaultBeacon> { _ in}])

        guard let view: AnyView = player.hooks?.view.call(AnyView(TestButton())) else {
            return XCTFail("no view returned from hook")
        }

        // Should be wrapped in 2 anyviews, one for playercontrollers, one for beaconcontext
        _ = try view.inspect().anyView().anyView().view(TestButton.self)
    }
    func testBeaconContext() throws {
        let expect = expectation(description: "Beacon Called")
        let beacon: (AssetBeacon) -> Void = { (beaconObj: AssetBeacon) in
            guard
                beaconObj.action == "clicked",
                beaconObj.element == "button",
                beaconObj.asset.id == "test"
            else { return XCTFail("incorrect beacon information") }
            expect.fulfill()
        }

        let context = BeaconContext(beacon)
        var tree = TestButton()

        let exp = tree.on(\.didAppear) { view in
            try view.button().tap()
        }

        ViewHosting.host(view: tree.environment(\.beaconContext, context))

        wait(for: [exp, expect], timeout: 10)
    }

    func testBeaconContextWithMetaData() throws {
        let expect = expectation(description: "Beacon Called")
        let beacon: (AssetBeacon) -> Void = { (beaconObj: AssetBeacon) in
            guard
                beaconObj.action == "clicked",
                beaconObj.element == "button",
                beaconObj.asset.id == "test",
                case .dictionary(let data) = beaconObj.asset.metaData?.beacon,
                data["field"] == "value"
            else { return XCTFail("incorrect beacon information") }
            expect.fulfill()
        }

        let context = BeaconContext(beacon)
        let data = MetaData(beacon: .dictionary(data: ["field": "value"]))
        var tree = TestButton(metaData: data)

        let exp = tree.on(\.didAppear) { view in
            try view.button().tap()
        }

        ViewHosting.host(view: tree.environment(\.beaconContext, context))

        wait(for: [exp, expect], timeout: 10)
    }

    func testSendsViewBeacon() {
        let beaconed = expectation(description: "View beacon called")
        let plugin = BeaconPlugin<DefaultBeacon>(plugins: []) { (beacon) in
            guard beacon.action == "viewed" else { return }
            beaconed.fulfill()
        }

        let player = SwiftUIPlayer(
            flow: FlowData.COUNTER,
            plugins: [ReferenceAssetsPlugin(), plugin]
        )
        ViewHosting.host(view: player)

        wait(for: [beaconed], timeout: 5)
    }
}

struct TestButton: View {
    @Environment(\.beaconContext) var beaconContext
    var metaData: MetaData?
    internal var didAppear: ((Self) -> Void)?
    var body: some View {
        Button(action: {
            if let data = metaData {
                beaconContext?.beacon(action: "clicked", element: "button", id: "test", metaData: data)
            } else {
                beaconContext?.beacon(action: "clicked", element: "button", id: "test")
            }
        }, label: {Text("Beacon")})
        .onAppear { self.didAppear?(self) }
    }
}
