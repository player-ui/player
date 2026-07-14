import Combine
import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUITestUtilitiesCore
import XCTest

class ManagedPlayerJSContextLifecycleTests: XCTestCase {
    /// Verifies that the old JSContext is properly released when
    /// SwiftUIPlayer.Context loads a new flow after unloading the previous one.
    ///
    /// The contextBuilder creates a new JSContext each time load() is called.
    /// After unload() + reload, the old JSContext should be deallocated.
    /// Ensures no cross-runtime retain cycles survive between Swift closures
    /// captured in JS hook taps and JSValues referencing the old context.
    func testOldJSContextDeallocatedAfterUnloadAndReload() {
        weak var weakOldContext: JSContext?

        var contextCount = 0
        let context = SwiftUIPlayer.Context {
            contextCount += 1
            let ctx = JSContext()!
            if contextCount == 1 {
                weakOldContext = ctx
            }
            return ctx
        }

        autoreleasepool {
            let player1 = SwiftUIPlayer(
                flow: FlowData.COUNTER,
                plugins: [],
                result: .constant(nil),
                context: context
            )
            _ = player1
        }

        XCTAssertNotNil(weakOldContext, "First JSContext should exist while loaded")
        XCTAssertTrue(context.isLoaded, "Context should be loaded after init")

        autoreleasepool {
            context.unload()
        }
        XCTAssertFalse(context.isLoaded, "Context should not be loaded after unload")

        // Drain pending GCD blocks (setTimeout polyfill dispatches
        // background→main) that may still hold JSValue refs to the old context.
        waitForDeallocation(of: { weakOldContext }, timeout: 2.0)

        autoreleasepool {
            let player2 = SwiftUIPlayer(
                flow: FlowData.COUNTER.replacingOccurrences(
                    of: "counter-flow",
                    with: "counter-flow-2"
                ),
                plugins: [],
                result: .constant(nil),
                context: context
            )
            _ = player2
        }

        XCTAssertEqual(contextCount, 2, "contextBuilder should have been called twice")
        XCTAssertNil(
            weakOldContext,
            "Old JSContext was not deallocated after unload + reload — " +
                "cross-runtime retain cycle between Swift closures and JSContext"
        )
    }

    /// Verifies that the shared JSVirtualMachine does not accumulate orphaned
    /// JSContexts across multiple flow loads, simulating the ManagedPlayer
    /// navigation pattern. Each flow load creates a new JSContext on the same VM.
    /// After unload, the previous context should be released.
    func testSharedVMDoesNotAccumulateContexts() throws {
        let vm = try XCTUnwrap(JSVirtualMachine())
        var createdContexts = [Weak<JSContext>]()

        let context = SwiftUIPlayer.Context {
            let ctx = JSContext(virtualMachine: vm)!
            createdContexts.append(Weak(ctx))
            return ctx
        }

        for i in 0 ..< 5 {
            autoreleasepool {
                let flow = FlowData.COUNTER.replacingOccurrences(
                    of: "counter-flow",
                    with: "counter-flow-\(i)"
                )
                let player = SwiftUIPlayer(
                    flow: flow,
                    plugins: [],
                    result: .constant(nil),
                    context: context
                )
                _ = player
            }

            autoreleasepool {
                context.unload()
            }

            waitForDeallocation(of: { createdContexts[i].value }, timeout: 2.0)
        }

        XCTAssertEqual(createdContexts.count, 5, "Should have created 5 JSContexts")

        let leakedCount = createdContexts.filter { $0.value != nil }.count
        XCTAssertEqual(
            leakedCount, 0,
            "\(leakedCount) of 5 JSContexts still alive after unload — " +
                "orphaned contexts accumulating on shared JSVirtualMachine"
        )
    }

    /// Spins the run loop until `object()` returns nil or `timeout` elapses.
    /// The setTimeout polyfill dispatches via GCD (background → main), so
    /// the run loop must tick to let those blocks execute and release JSValues.
    private func waitForDeallocation(of object: @escaping () -> AnyObject?, timeout: TimeInterval) {
        let deadline = Date(timeIntervalSinceNow: timeout)
        while object() != nil, Date() < deadline {
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.01))
        }
    }
}

private class Weak<T: AnyObject> {
    weak var value: T?

    init(_ value: T) {
        self.value = value
    }
}
