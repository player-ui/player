import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUISwiftUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIContextPlugin

class ContextPluginTests: XCTestCase {
    func testSetAndGetRoundTrip() {
        let plugin = ContextPlugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])
        XCTAssertNotNil(player)

        plugin.set(name: "greeting", description: "A greeting", value: .string(data: "hello"))

        guard case let .string(value) = plugin.get(name: "greeting") else {
            return XCTFail("expected a string value")
        }
        XCTAssertEqual(value, "hello")
    }

    func testHasReflectsPresence() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        XCTAssertFalse(plugin.has(name: "absent"))
        plugin.set(name: "present", description: "A flag", value: .string(data: "yes"))
        XCTAssertTrue(plugin.has(name: "present"))
    }

    func testSubscribeReceivesUpdatesForItsKey() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        let expectation = XCTestExpectation(description: "subscriber called")
        _ = plugin.subscribe(name: "counter", description: "A counter") { value, name in
            XCTAssertEqual(name, "counter")
            if case .string(let s) = value {
                XCTAssertEqual(s, "tick")
                expectation.fulfill()
            } else {
                XCTFail("expected a string value")
            }
        }

        plugin.set(name: "counter", description: "A counter", value: .string(data: "tick"))
        wait(for: [expectation], timeout: 3)
    }

    func testSubscribeAllSurfacesNameAndDescription() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        let expectation = XCTestExpectation(description: "global subscriber called")
        _ = plugin.subscribeAll { _, name, description in
            XCTAssertEqual(name, "flag")
            XCTAssertEqual(description, "A flag")
            expectation.fulfill()
        }

        plugin.set(name: "flag", description: "A flag", value: .string(data: "on"))
        wait(for: [expectation], timeout: 3)
    }

    func testGetDecodesAFunctionValuedMemberAsACallable() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        // Register an object entry with a function member directly on the JS
        // plugin, mirroring how StateContextPlugin publishes scoped actions.
        plugin.pluginRef?.context.evaluateScript(
            "globalThis.__ctxForm = { label: 'Greeter', greet: (msg) => 'echoed: ' + msg };"
        )
        let obj = plugin.pluginRef?.context.objectForKeyedSubscript("__ctxForm")
        plugin.pluginRef?.invokeMethod(
            "setByName",
            withArguments: ["form", "A form with an action", obj as Any]
        )

        guard let form = plugin.get(name: "form", as: FormContext.self) else {
            return XCTFail("expected a decoded FormContext")
        }
        XCTAssertEqual(form.label, "Greeter")
        // The function member is a directly-callable WrappedFunction.
        XCTAssertNotNil(form.greet)
    }

    func testGetReturnsNilForAbsentEntries() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])
        XCTAssertNil(plugin.get(name: "absent", as: FormContext.self))
    }

    func testUnsubscribeStopsCallbacks() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        var callCount = 0
        let token = plugin.subscribe(name: "k", description: "K", handler: { _, _ in
            callCount += 1
        })
        guard let token = token else { return XCTFail("expected a subscription token") }

        plugin.set(name: "k", description: "K", value: .string(data: "one"))
        plugin.unsubscribe(token: token)
        plugin.set(name: "k", description: "K", value: .string(data: "two"))

        XCTAssertEqual(callCount, 1)
    }

    func testReadsPlayerStateContextWithScopedActions() {
        let context = ContextPlugin()
        let player = HeadlessPlayerImpl(plugins: [context, StateContextPlugin()])

        // Wait until the aggregate has populated (data controller bound).
        let populated = XCTestExpectation(description: "player.state has actions")
        _ = context.subscribe(name: "player.state", description: "state") { _, _ in
            if context.get(name: "player.state", as: PlayerStateContext.self)?.data.set != nil {
                populated.fulfill()
            }
        }

        // The flow.transition action drives the flow to completion, which
        // resolves the start callback with a CompletedState.
        let completed = XCTestExpectation(description: "flow completed")
        player.start(flow: FlowData.COUNTER) { result in
            if case .success = result { completed.fulfill() }
        }
        wait(for: [populated], timeout: 5)

        guard let state = context.get(name: "player.state", as: PlayerStateContext.self) else {
            return XCTFail("expected a decoded PlayerStateContext")
        }
        XCTAssertEqual(state.status, "in-progress")
        XCTAssertEqual(state.flow.id, "counter-flow")

        // Validation state deserializes across the bridge. With no binding
        // tracking in this headless flow it is empty and transitionable.
        XCTAssertTrue(state.validation.canTransition)
        XCTAssertTrue(state.validation.byBinding.isEmpty)

        // Actions are scoped to their constructs and bridged as callables.
        guard let transition = state.flow.transition else { return XCTFail("expected a flow.transition action") }
        guard let set = state.data.set else { return XCTFail("expected a data.set action") }

        // The scoped data.set action drives the real data model; reading the
        // aggregate back reflects the write through data.model.
        set("count", 5)
        let model = context.get(name: "player.state", as: PlayerStateContext.self)?.data.model
        guard case let .numberDictionary(data)? = model else {
            return XCTFail("expected a numeric data model, got \(String(describing: model))")
        }
        XCTAssertEqual(data["count"], 5)

        // The scoped flow.transition action advances the flow to completion.
        transition("Next")
        wait(for: [completed], timeout: 5)
    }

    func testGetReadsAPrimitiveValue() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        plugin.set(name: "answer", description: "The answer", value: .number(data: 42))
        guard case let .number(value) = plugin.get(name: "answer") else {
            return XCTFail("expected a number value")
        }
        XCTAssertEqual(value, 42)
    }

    func testListReportsRegisteredDescriptors() {
        let plugin = ContextPlugin()
        _ = HeadlessPlayerImpl(plugins: [plugin])

        plugin.set(name: "flag", description: "A flag", value: .bool(data: true))

        let descriptions = plugin.list().map { $0.description }
        XCTAssertTrue(descriptions.contains("A flag"))
        guard let flag = plugin.list().first(where: { $0.description == "A flag" }) else {
            return XCTFail("expected the flag descriptor")
        }
        XCTAssertTrue(flag.hasValue)
    }

    func testFlowEndFreezesAHistorySnapshotCapturingTheTerminalState() {
        let context = ContextPlugin()
        let player = HeadlessPlayerImpl(plugins: [context, StateContextPlugin()])

        let populated = XCTestExpectation(description: "player.state has actions")
        _ = context.subscribe(name: "player.state", description: "state") { _, _ in
            if context.get(name: "player.state", as: PlayerStateContext.self)?.flow.transition != nil {
                populated.fulfill()
            }
        }

        let completed = XCTestExpectation(description: "flow completed")
        player.start(flow: FlowData.COUNTER) { result in
            if case .success = result { completed.fulfill() }
        }
        wait(for: [populated], timeout: 5)

        context.get(name: "player.state", as: PlayerStateContext.self)?.flow.transition?("Next")
        wait(for: [completed], timeout: 5)

        // Flow end freezes the store into a history snapshot capturing the
        // terminal flow state, read by name like live context.
        guard let snapshot = context.history().last else {
            return XCTFail("expected a frozen history snapshot")
        }
        XCTAssertEqual(snapshot.flowId, "counter-flow")
        XCTAssertEqual(snapshot.get(name: "player.flow.state", as: String.self), "END_Done")
        // Absent keys read back as nil.
        XCTAssertNil(snapshot.get(name: "never.frozen", as: String.self))
    }

    func testFrozenSnapshotActionsAreTombstonedAndThrowWhenInvoked() {
        let context = ContextPlugin()
        let player = HeadlessPlayerImpl(plugins: [context, StateContextPlugin()])

        let populated = XCTestExpectation(description: "player.state has actions")
        _ = context.subscribe(name: "player.state", description: "state") { _, _ in
            if context.get(name: "player.state", as: PlayerStateContext.self)?.flow.transition != nil {
                populated.fulfill()
            }
        }
        let completed = XCTestExpectation(description: "flow completed")
        player.start(flow: FlowData.COUNTER) { result in
            if case .success = result { completed.fulfill() }
        }
        wait(for: [populated], timeout: 5)
        context.get(name: "player.state", as: PlayerStateContext.self)?.flow.transition?("Next")
        wait(for: [completed], timeout: 5)

        // The frozen player.state retains its scoped actions, but they are
        // tombstoned — present yet poisoned: invoking one raises a JS error.
        guard let frozen = context.history().last?
            .get(name: "player.state", as: PlayerStateContext.self) else {
            return XCTFail("expected a frozen PlayerStateContext")
        }
        guard let transition = frozen.flow.transition, let jsContext = transition.rawValue?.context else {
            return XCTFail("expected a tombstoned transition action")
        }

        // The player's exception handler swallows JS throws, so capture the
        // thrown value with a temporary handler while invoking the tombstone.
        var thrown: String?
        let previous = jsContext.exceptionHandler
        jsContext.exceptionHandler = { _, value in thrown = value?.toString() }
        defer { jsContext.exceptionHandler = previous }

        transition("Next")
        XCTAssertTrue(thrown?.contains("no longer valid") == true, "got: \(thrown ?? "nil")")
    }
}

/// A small structured context with a bridged function member, used to verify
/// `get` decodes function-valued fields into callable `WrappedFunction`s.
private struct FormContext: Decodable {
    let label: String
    let greet: WrappedFunction<Void>?
}
