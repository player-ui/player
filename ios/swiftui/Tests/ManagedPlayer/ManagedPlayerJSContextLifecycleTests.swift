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

    /// Regression test for PLAYA-10711: a caller-supplied plugin (e.g. BeaconPlugin)
    /// must be torn down on unload() too, not just Player's internal partialMatchPlugin
    /// — otherwise a late callback can invoke into an already torn-down JSContext.
    func testUnloadTearsDownCallerSuppliedPlugins() {
        let context = SwiftUIPlayer.Context { JSContext()! }
        let spy = TeardownSpyPlugin()

        autoreleasepool {
            let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [spy], context: context)
            _ = player
        }

        XCTAssertEqual(spy.applyCallCount, 1, "Plugin should have been applied on load")
        XCTAssertEqual(spy.teardownCallCount, 0, "Plugin should not be torn down before unload")

        context.unload()

        XCTAssertEqual(
            spy.teardownCallCount, 1,
            "unload() should call teardown() on every caller-supplied plugin"
        )
    }

    /// Verifies a caller-supplied JSBasePlugin's pluginRef/context are released on
    /// unload(), so its guard-based calls into JS (e.g. BaseBeaconPlugin.beacon(_:))
    /// safely no-op afterward instead of invoking a stale, torn-down JSContext.
    func testUnloadReleasesCallerSuppliedJSBasePluginReferences() {
        let context = SwiftUIPlayer.Context { JSContext()! }
        // Stand-in JSBasePlugin + NativePlugin conformer; its own matching behavior
        // isn't under test here, only that Context.unload() releases its references.
        let plugin = PartialMatchFingerprintPlugin()

        autoreleasepool {
            let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [plugin], context: context)
            _ = player
        }

        XCTAssertNotNil(plugin.pluginRef, "pluginRef should be set once applied to a loaded context")
        XCTAssertNotNil(plugin.context, "context should be set once applied to a loaded context")

        context.unload()

        XCTAssertNil(
            plugin.pluginRef,
            "A caller-supplied JSBasePlugin's pluginRef must be released on unload()"
        )
        XCTAssertNil(plugin.context)
    }

    /// The context (e.g. global `sharedManaged`, which ManagedPlayer never unloads on
    /// dismissal) must not keep caller-supplied plugins alive.
    func testContextDoesNotRetainPlugins() {
        let context = SwiftUIPlayer.Context { JSContext()! }
        weak var weakSpy: TeardownSpyPlugin?

        autoreleasepool {
            let spy = TeardownSpyPlugin()
            weakSpy = spy
            let player = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [spy], context: context)
            _ = player
        }

        XCTAssertTrue(context.isLoaded)
        XCTAssertNil(weakSpy, "Context should hold plugins weakly")
    }

    /// Verifies loading a new flow without `unload()` tears down the previous flow's plugins,
    /// which would otherwise keep pointing at the old JSContext, and leaves the new ones active.
    func testLoadingNewFlowTearsDownPreviousPlugins() {
        let context = SwiftUIPlayer.Context { JSContext()! }
        let first = TeardownSpyPlugin()
        let second = TeardownSpyPlugin()

        autoreleasepool {
            _ = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [first], context: context)
            _ = SwiftUIPlayer(
                flow: FlowData.COUNTER.replacingOccurrences(of: "counter-flow", with: "counter-flow-2"),
                plugins: [second],
                context: context
            )
        }

        XCTAssertEqual(first.teardownCallCount, 1, "Previous flow's plugin should be torn down")
        XCTAssertEqual(second.teardownCallCount, 0, "Current flow's plugin should stay active")
    }

    /// Loading a new flow without `unload()` must release the previous JSContext too, not
    /// just its plugins — guards against anything retaining it across flow-to-flow
    /// transitions (ManagedPlayer can load-over-load without an intervening `unload()`).
    func testLoadingNewFlowReleasesPreviousJSContext() {
        weak var weakFirstContext: JSContext?
        var contextCount = 0
        let context = SwiftUIPlayer.Context {
            contextCount += 1
            let ctx = JSContext()!
            if contextCount == 1 { weakFirstContext = ctx }
            return ctx
        }

        autoreleasepool {
            _ = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [], context: context)
        }
        XCTAssertNotNil(weakFirstContext, "First JSContext should exist while loaded")

        autoreleasepool {
            _ = SwiftUIPlayer(
                flow: FlowData.COUNTER.replacingOccurrences(of: "counter-flow", with: "counter-flow-2"),
                plugins: [],
                context: context
            )
        }
        waitForDeallocation(of: { weakFirstContext }, timeout: 2.0)

        XCTAssertEqual(contextCount, 2)
        XCTAssertTrue(context.isLoaded, "Second flow should be loaded")
        XCTAssertNil(weakFirstContext, "Previous JSContext leaked across load-over-load")
    }

    /// If `setupPlayer` fails, `load()` must not leave a half-wired state: the previous flow
    /// is torn down, the plugins setupPlayer already wired to the orphaned context are
    /// released (else a later `unload()` can't reach them — the PLAYA-10711 bug class), and
    /// the orphaned context itself is freed.
    func testFailedSetupLeavesContextFullyUnloaded() {
        weak var weakFailedContext: JSContext?
        var contextCount = 0
        let context = SwiftUIPlayer.Context {
            contextCount += 1
            let ctx = JSContext()!
            if contextCount == 2 {
                // A non-writable `Player` global stops the core bundle from installing
                // `Player.Player`, so setupPlayer can't construct a player and returns nil.
                ctx.evaluateScript(
                    "Object.defineProperty(this, 'Player', { value: {}, writable: false, configurable: false });"
                )
                weakFailedContext = ctx
            }
            return ctx
        }
        let firstPlugin = PartialMatchFingerprintPlugin()
        let failedPlugin = PartialMatchFingerprintPlugin()

        autoreleasepool {
            _ = SwiftUIPlayer(flow: FlowData.COUNTER, plugins: [firstPlugin], context: context)
        }
        XCTAssertTrue(context.isLoaded)

        autoreleasepool {
            _ = SwiftUIPlayer(
                flow: FlowData.COUNTER.replacingOccurrences(of: "counter-flow", with: "counter-flow-2"),
                plugins: [failedPlugin],
                context: context
            )
        }

        XCTAssertEqual(contextCount, 2, "Second load should have attempted a new JSContext")
        XCTAssertFalse(context.isLoaded, "Failed load must end fully unloaded, not half-wired")
        XCTAssertNil(firstPlugin.pluginRef, "Previous flow's plugin should be torn down")
        XCTAssertNil(firstPlugin.context)
        XCTAssertNil(
            failedPlugin.pluginRef,
            "Plugin wired to the orphaned context before setup failed must be released"
        )
        XCTAssertNil(failedPlugin.context)

        waitForDeallocation(of: { weakFailedContext }, timeout: 2.0)
        XCTAssertNil(weakFailedContext, "Orphaned JSContext from the failed setup leaked")
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

/// Spy `NativePlugin` used to verify `SwiftUIPlayer.Context.unload()` calls
/// `teardown()` on every caller-supplied plugin.
private class TeardownSpyPlugin: NativePlugin {
    let pluginName = "TeardownSpyPlugin"
    private(set) var applyCallCount = 0
    private(set) var teardownCallCount = 0

    func apply(player _: some HeadlessPlayer) {
        applyCallCount += 1
    }

    func teardown() {
        teardownCallCount += 1
    }
}
