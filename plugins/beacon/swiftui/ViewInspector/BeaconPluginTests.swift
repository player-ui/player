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
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUIBaseBeaconPlugin
@testable import PlayerUIBeaconPlugin

extension Inspection: InspectionEmissary { }

class BeaconPluginTests: XCTestCase {
    override func setUp() {
        XCUIApplication().terminate()
    }

func testBuildCancelsSpecificBeaconsUsingHooks() {
    let handlerExpectation = expectation(description: "Beacon Handler called")
    let cancelBeaconHandler = expectation(description: "Cancel Beacon Handler called")
    let buildBeaconHandler = expectation(description: "Build Beacon Handler called")

    let handler = MockHandler()
    let plugin = BeaconPlugin<DefaultBeacon>(plugins: []) { (beacon) in
    print("Beacon: \(beacon)")
        handler.handle(beacon.viewId!, beacon.data)
        handlerExpectation.fulfill()
    }

    let context = JSContext()!
    JSUtilities.polyfill(context)
    plugin.context = context
    plugin.setup(context: context)

    guard let hooks = plugin.hooks else {
        XCTFail("Hooks are not initialized")
        return
    }

    hooks.buildBeacon.tap { (arg1: JSValue, arg2: JSValue) -> JSValue? in
        buildBeaconHandler.fulfill()
       if let action = arg1.toDictionary()?["action"] as? String, action == "viewed" {
        return JSValue(bool: true, in: context)
       }
        return JSValue(bool: false, in: context)
    }

    hooks.cancelBeacon.tap { (arg1: JSValue, arg2: JSValue) -> Bool in
        cancelBeaconHandler.fulfill()

        if let action = arg1.toDictionary()?["action"] as? String, action == "viewed" {
                return true
               }
        return false
    }

    let playerContext = SwiftUIPlayer.Context { context }

    let player = SwiftUIPlayer(
        flow: FlowData.COUNTER,
        plugins: [ReferenceAssetsPlugin(), plugin],
        context: playerContext
    )
    ViewHosting.host(view: player)

    let viewExpectation = player.inspection.inspect(after: 1.0) { view in
         _ = try view.vStack().first?.anyView().find(text: "Clicked 0 times")
    }

    wait(for: [handlerExpectation, cancelBeaconHandler, buildBeaconHandler,viewExpectation], timeout: 10)

    ViewHosting.expel()
}

}

class MockHandler {
    var calls: [(String, Any?)] = []
    
    func handle(_ action: String, _ data: Any? = nil) {
        calls.append((action, data))
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
