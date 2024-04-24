//
//  MetricsPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 6/23/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
import ViewInspector
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUIMetricsPlugin
@testable import PlayerUIReferenceAssets

class TapCounterPlugin: NativePlugin {
    var pluginName: String = "TapCounter"
    var count = 0
    func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.view.interceptRegister({ info in
            self.count += 1
            return info
        })
    }
}
class MetricsPluginTests: XCTestCase {
    func testConstruction() {
        let context = JSContext()
        let plugin = MetricsPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }

    func testRenderTimeTracking() {
        let renderEndCalled = XCTestExpectation(description: "renderEnd called")
        let callback: @convention(block) () -> Void = {
            renderEndCalled.fulfill()
        }
        let plugin = MetricsPlugin()
        let counter = TapCounterPlugin()

        let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [counter, plugin, ReferenceAssetsPlugin()])

        let jscallback = JSValue(object: callback, in: plugin.pluginRef!.context)
        plugin.pluginRef?.setValue(jscallback, forProperty: "renderEnd")

        XCTAssertEqual(counter.count, 1)

        ViewHosting.host(view: player)

        wait(for: [renderEndCalled], timeout: 10)
    }

    func testNoRenderTimeTracking() {
        let counter = TapCounterPlugin()
        let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [counter, MetricsPlugin(trackRenderTime: false)])

        XCTAssertEqual(counter.count, 0)
    }

    func testHandler() throws {
        let calledBack = expectation(description: "RenderEnd handler called")
        let player = SwiftUIPlayer(
            flow: FlowData.COUNTER,
            plugins: [
                ReferenceAssetsPlugin(),
                MetricsPlugin(trackRenderTime: true) { timing, nodeMetrics, flowMetrics in
                    XCTAssertNotNil(timing)
                    XCTAssertNotNil(nodeMetrics)
                    XCTAssertNotNil(flowMetrics)
                    calledBack.fulfill()
                }
            ]
        )

        ViewHosting.host(view: player)

        wait(for: [calledBack], timeout: 2)
    }
}

class RequestTimePluginTests: XCTestCase {
    func testRequestTimeTracking() {
        let renderEndCalled = XCTestExpectation(description: "renderEnd handler called")
        let plugin = MetricsPlugin { (_, _, flow) in
            guard let req = flow?.flow.requestTime else { return }
            XCTAssertEqual(req, 5)
            renderEndCalled.fulfill()
        }

        let counter = TapCounterPlugin()

        let player = SwiftUIPlayer(
            flow: FlowData.COUNTER,
            plugins: [
                counter,
                plugin,
                RequestTimePlugin { 5 },
                ReferenceAssetsPlugin()
            ]
        )

        XCTAssertEqual(counter.count, 1)

        ViewHosting.host(view: player)

        wait(for: [renderEndCalled], timeout: 10)
    }
}
