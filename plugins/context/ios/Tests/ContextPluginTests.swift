import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
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
}
