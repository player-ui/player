import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUITestUtilitiesCore

// MARK: - Test 1: Player + JSContext deallocation after flow completes

class JSContextRetainCycleTests: XCTestCase {

    /// Verifies that HeadlessPlayerImpl and its JSContext are properly
    /// deallocated after a flow completes and all external references
    /// are dropped. Ensures no retain cycle exists between Swift objects
    /// and the JSContext through hook tap closures.
    func testPlayerDeallocatesAfterFlowCompletes() {
        weak var weakPlayer: HeadlessPlayerImpl?
        weak var weakContext: JSContext?

        let completed = expectation(description: "flow completed")

        autoreleasepool {
            let player = HeadlessPlayerImpl(plugins: [])
            weakPlayer = player
            weakContext = player.jsPlayerReference?.context

            player.start(flow: FlowData.COUNTER) { _ in
                completed.fulfill()
            }

            do {
                try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
            } catch {
                XCTFail("Transition with 'NEXT' failed: \(error)")
            }
        }

        wait(for: [completed], timeout: 5)

        XCTAssertNil(weakPlayer, "HeadlessPlayerImpl was not deallocated — retain cycle detected")
        XCTAssertNil(weakContext, "JSContext was not deallocated — retain cycle detected")
    }

    // MARK: - Test 2: Plugin deallocation after hook tap

    /// Verifies that an object captured in a hook `.tap()` closure is
    /// properly released when the player is deallocated, ensuring closures
    /// registered in the JSContext do not cause permanent retention.
    func testPluginDeallocatesAfterHookTap() {
        weak var weakPlugin: LeakTestPlugin?

        autoreleasepool {
            let player = HeadlessPlayerImpl(plugins: [])
            let plugin = LeakTestPlugin()
            weakPlugin = plugin

            player.hooks?.state.tap({ _ in
                _ = plugin.pluginName
            })

            player.start(flow: FlowData.COUNTER) { _ in }
        }

        XCTAssertNil(weakPlugin, "Plugin retained by hook tap closure — closure is never unregistered from JSContext")
    }

    // MARK: - Test 4: Nested tap accumulation

    /// Proves that nested `.tap()` calls inside hooks accumulate additional
    /// closures on every hook fire, rather than replacing previous ones.
    /// After N view updates, the inner tap should fire once per update,
    /// not N times per update.
    func testNestedTapDoesNotAccumulate() {
        let player = HeadlessPlayerImpl(plugins: [])
        var innerTapFireCount = 0

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { _ in
                    innerTapFireCount += 1
                }
            }
        }

        player.start(flow: FlowData.COUNTER) { _ in }

        guard player.state is InProgressState else {
            return XCTFail("Player not in progress after start")
        }

        let countAfterFirstView = innerTapFireCount

        do {
            try (player.state as? InProgressState)?.controllers?.flow.transition(with: "NEXT")
        } catch {
            XCTFail("Transition failed: \(error)")
        }

        let countAfterTransition = innerTapFireCount
        let incrementFromTransition = countAfterTransition - countAfterFirstView

        XCTAssertLessThanOrEqual(
            incrementFromTransition, 1,
            "Inner onUpdate tap fired \(incrementFromTransition) times after one transition — " +
            "nested taps are accumulating (\(countAfterFirstView) after first view, \(countAfterTransition) after transition)"
        )
    }

    // MARK: - Test 5: AsyncHook deallocation after tap

    /// Verifies that AsyncHook is properly deallocated and does not retain
    /// itself through the `@convention(block)` closure passed to JSContext.
    func testAsyncHookDeallocates() {
        weak var weakHook: AsyncHook<BaseFlowState>?

        autoreleasepool {
            let player = HeadlessPlayerImpl(plugins: [])
            guard let playerRef = player.jsPlayerReference else {
                return XCTFail("Player reference is nil")
            }

            let hook = AsyncHook<BaseFlowState>(baseValue: playerRef, name: "state")
            weakHook = hook

            hook.tap { _ in return nil }
        }

        XCTAssertNil(weakHook, "AsyncHook retained by strong self-capture in @convention(block) closure")
    }
}

// MARK: - Test helpers

private class LeakTestPlugin: NativePlugin {
    var pluginName: String = "LeakTestPlugin"
    func apply<P>(player: P) where P: HeadlessPlayer {}
}
