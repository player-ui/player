//
//  BeaconPluginLifecycleTests.swift
//  PlayerUI_Tests
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIBaseBeaconPlugin
@testable import PlayerUIBeaconPlugin
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
import SwiftUI
import ViewInspector
import XCTest

class BeaconPluginLifecycleTests: XCTestCase {
    /// Reproduces the PLAYA-10711 crash scenario:
    /// An input view retains `BeaconContext` from the environment.
    /// After a flow transition calls `unload()`, a delayed `onEditingChanged` triggers a beacon.
    /// The beacon must not execute JavaScript or retain the unloaded `JSContext`.
    func testLateBeaconAfterUnloadDoesNotTouchTornDownContext() throws {
        weak var weakJSContext: JSContext?
        let playerContext = SwiftUIPlayer.Context {
            let ctx = JSContext()!
            weakJSContext = ctx
            return ctx
        }

        // Only count the simulated input beacon; the flow's async "viewed" beacon may land late.
        var lateBeacons = 0
        let plugin = BeaconPlugin<DefaultBeacon>(plugins: []) { beacon in
            if beacon.action == "changed" { lateBeacons += 1 }
        }

        var captured: BeaconContext?
        let appeared = expectation(description: "Input-like view captured its BeaconContext")
        // onAppear can fire more than once under re-hosting; don't fail on over-fulfill.
        appeared.assertForOverFulfill = false
        try autoreleasepool {
            let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [plugin], context: playerContext)
            let input = BeaconContextProbe {
                captured = $0
                appeared.fulfill()
            }
            // Same path the crash took: BeaconPlugin's view hook injects the BeaconContext.
            ViewHosting.host(view: try XCTUnwrap(player.hooks?.view.call(AnyView(input))))
        }
        wait(for: [appeared], timeout: 5)
        let beaconContext = try XCTUnwrap(captured, "BeaconPlugin should inject a BeaconContext")

        // Flow transition: ManagedPlayer `.idle` calls unload() while the input view still exists.
        playerContext.unload()
        waitForDeallocation(of: { weakJSContext }, timeout: 2)

        // Records any JS exception raised in the old context, i.e. the crash's `notifyException`.
        var lateExceptions = 0
        weakJSContext?.exceptionHandler = { _, _ in lateExceptions += 1 }

        // Delayed onEditingChanged(false) → commit → set → beacon (crash frames 5 → 3).
        beaconContext.beacon(action: "changed", element: "input", id: "input-1")
        RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.3))

        XCTAssertEqual(lateBeacons, 0, "Late beacon was delivered through the torn-down JSContext")
        XCTAssertEqual(lateExceptions, 0, "Late beacon raised a JS exception in the torn-down JSContext")
        XCTAssertNil(weakJSContext, "BeaconPlugin kept the torn-down JSContext alive")

        ViewHosting.expel()
    }

    /// Spins the run loop until `object()` is nil or `timeout` elapses, so pending
    /// `setTimeout` callbacks can run and release their JSValues.
    private func waitForDeallocation(of object: @escaping () -> AnyObject?, timeout: TimeInterval) {
        let deadline = Date(timeIntervalSinceNow: timeout)
        while object() != nil, Date() < deadline {
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.01))
        }
    }
}

/// Stand-in for an input asset view: reads the environment `BeaconContext` like
/// `InputAssetViewModel` does, and hands it back to the test once it appears.
private struct BeaconContextProbe: View {
    @Environment(\.beaconContext) private var beaconContext: BeaconContext?
    let onCapture: (BeaconContext?) -> Void

    var body: some View {
        Color.clear.onAppear { onCapture(beaconContext) }
    }
}
