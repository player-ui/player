//
//  TinyPubSubTests.swift
//  PlayerUI
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUIPubSubPlugin

class TinyPubSubTests: XCTestCase {
    // MARK: - Helpers

    private func makeContext() -> JSContext {
        let context = JSContext()!
        JSUtilities.polyfill(context)
        return context
    }

    // MARK: - Initialization

    func testContextAssignmentCreatesJSInstance() {
        let bus = TinyPubSub()
        XCTAssertNil(bus.jsValue, "jsValue should be nil before context is assigned")

        bus.context = makeContext()
        XCTAssertNotNil(bus.jsValue, "jsValue should be set after context is assigned")
    }

    func testSecondContextAssignmentIsIgnored() {
        let bus = TinyPubSub()
        let context1 = makeContext()
        let context2 = makeContext()

        bus.context = context1
        let first = bus.jsValue

        bus.context = context2
        XCTAssertTrue(bus.jsValue === first, "jsValue should not change after the first assignment")
    }

    // MARK: - Subscribe / Publish

    func testSubscribeAndPublishString() {
        let bus = TinyPubSub()
        bus.context = makeContext()

        let expectation = XCTestExpectation(description: "string event received")
        bus.subscribe(eventName: "test") { _, data in
            guard case .string(let result) = data else { return XCTFail("expected string") }
            XCTAssertEqual(result, "hello")
            expectation.fulfill()
        }

        bus.publish(eventName: "test", eventData: .string(data: "hello"))
        wait(for: [expectation], timeout: 2)
    }

    func testSubscribeBeforeContextIsIgnored() {
        let bus = TinyPubSub()
        // No context assigned yet — subscribe should not crash and should return nil
        let token = bus.subscribe(eventName: "test") { _, _ in XCTFail("should not be called") }
        XCTAssertNil(token)
    }

    // MARK: - Unsubscribe

    func testUnsubscribeStopsEvents() {
        let bus = TinyPubSub()
        bus.context = makeContext()

        var callCount = 0
        let token = bus.subscribe(eventName: "test") { _, _ in callCount += 1 }

        bus.publish(eventName: "test", eventData: .string(data: "first"))
        XCTAssertEqual(callCount, 1)

        bus.unsubscribe(token: token!)
        bus.publish(eventName: "test", eventData: .string(data: "second"))
        XCTAssertEqual(callCount, 1, "handler should not fire after unsubscribe")
    }

    // MARK: - Shared bus via plugins

    func testSharedBusViaPluginsSharesEvents() {
        let context = makeContext()
        let sharedBus = TinyPubSub()

        let plugin1 = PubSubPlugin([], pubsub: sharedBus)
        let plugin2 = PubSubPlugin(
            [],
            options: PubSubPluginOptions(expressionName: "customPublish"),
            pubsub: sharedBus
        )

        plugin1.context = context
        plugin2.context = context

        let expectation = XCTestExpectation(description: "event received via shared bus")
        sharedBus.subscribe(eventName: "ping") { _, data in
            guard case .string(let result) = data else { return XCTFail("expected string") }
            XCTAssertEqual(result, "pong")
            expectation.fulfill()
        }

        // Publish through plugin1 — subscriber on sharedBus should fire
        plugin1.publish(eventName: "ping", eventData: .string(data: "pong"))
        wait(for: [expectation], timeout: 2)
    }

    func testPluginSetupInitializesSharedBus() {
        let sharedBus = TinyPubSub()
        XCTAssertNil(sharedBus.jsValue)

        let plugin = PubSubPlugin([], pubsub: sharedBus)
        plugin.context = makeContext()

        XCTAssertNotNil(sharedBus.jsValue, "plugin setup should initialize the shared bus")
    }
}
