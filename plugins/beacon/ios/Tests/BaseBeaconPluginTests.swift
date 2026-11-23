//
//  BaseBeaconPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/11/21.
//  Copyright © 2021 Intuit. All rights reserved.
//

import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIBaseBeaconPlugin
import XCTest

class BPPlugin: JSBasePlugin {
    override open func setup(context _: JSContext) {}
}

class BaseBeaconPluginTests: XCTestCase {
    func testBundleLoadsSymbols() throws {
        let context = try XCTUnwrap(JSContext())

        let plugin = BaseBeaconPlugin<DefaultBeacon> { _ in }

        plugin.context = context

        // as accessed on main from beacon-plugin.prod.js
        XCTAssertFalse(context.objectForKeyedSubscript("BeaconPlugin")
            .objectForKeyedSubscript("BeaconPlugin")
            .isUndefined)
        XCTAssertFalse(context.objectForKeyedSubscript("BeaconPlugin")
            .objectForKeyedSubscript("BeaconPluginSymbol")
            .isUndefined)
    }

    func testBeaconPluginAppliesContextToPlugins() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)
        let bpp = BPPlugin(fileName: "", pluginName: "")

        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: [bpp]) { _ in }
        plugin.context = context

        XCTAssertNotNil(bpp.context)
    }

    func testBeaconFunction() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let beaconed = expectation(description: "Beacon sent")

        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: []) { _ in beaconed.fulfill() }
        plugin.context = context

        plugin.beacon(assetBeacon: AssetBeacon(
            action: "action",
            element: "element",
            asset: BeaconableAsset(id: "id")
        ))
        wait(for: [beaconed], timeout: 1)
    }

    func testBeaconPluginStringData() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let plugin = BaseBeaconPlugin<DefaultBeacon>(onBeacon: { beacon in
            XCTAssertEqual(beacon.assetId, "test")
            XCTAssertEqual(beacon.element, BeaconElement.button.rawValue)
            switch beacon.data {
            case let .string(string):
                XCTAssertEqual(string, "example")
            default:
                XCTFail("beacon data was not a string")
            }
            expectation.fulfill()
        })
        plugin.context = context

        plugin.beacon(assetBeacon: AssetBeacon(
            action: BeaconAction.clicked.rawValue,
            element: BeaconElement.button.rawValue,
            asset: BeaconableAsset(id: "test"),
            data: .string(data: "example")
        ))
        wait(for: [expectation], timeout: 2)
    }

    func testBeaconPluginDictionaryData() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let plugin = BaseBeaconPlugin<DefaultBeacon>(onBeacon: { beacon in
            XCTAssertEqual(beacon.assetId, "test")
            XCTAssertEqual(beacon.element, BeaconElement.button.rawValue)
            switch beacon.data {
            case let .dictionary(dict):
                XCTAssertEqual(dict, ["data": "example"])
            default:
                XCTFail("beacon data was not a dictionary")
            }
            expectation.fulfill()
        })
        plugin.context = context

        plugin.beacon(assetBeacon: AssetBeacon(
            action: BeaconAction.clicked.rawValue,
            element: BeaconElement.button.rawValue,
            asset: BeaconableAsset(id: "test"),
            data: .dictionary(data: ["data": "example"])
        ))
        wait(for: [expectation], timeout: 2)
    }

    func testBeaconPluginAnyDictionaryData() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let plugin = BaseBeaconPlugin<DefaultBeacon>(onBeacon: { beacon in
            XCTAssertEqual(beacon.assetId, "test")
            XCTAssertEqual(beacon.element, BeaconElement.button.rawValue)
            switch beacon.data {
            case let .anyDictionary(dict):
                XCTAssertEqual(2, dict.keys.count)
                XCTAssertEqual("example", dict["data"]?.as(String.self))
                XCTAssertEqual(3, dict["value"]?.as(Double.self))
            default:
                XCTFail("beacon data was not anyDictionary")
            }
            expectation.fulfill()
        })
        plugin.context = context

        plugin.beacon(assetBeacon: AssetBeacon(
            action: BeaconAction.clicked.rawValue,
            element: BeaconElement.button.rawValue,
            asset: BeaconableAsset(id: "test"),
            data: .anyDictionary(data: [
                "data": .string(data: "example"),
                "value": .number(data: 3),
            ])
        ))
        wait(for: [expectation], timeout: 2)
    }

    func testCancelSpecificBeaconsUsingHooks() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let cancelBeaconHandler = expectation(description: "Cancel Beacon Handler called")
        let handlerExpectation = expectation(description: "Handler called")
        handlerExpectation.isInverted = true

        let plugin = BaseBeaconPlugin<DefaultBeacon>(onBeacon: { beacon in
            XCTAssertEqual(beacon.assetId, "test")
            XCTAssertEqual(beacon.element, BeaconElement.button.rawValue)
            switch beacon.data {
            case let .string(string):
                XCTAssertEqual(string, "example")
            default:
                XCTFail("beacon data was not a string")
            }
            handlerExpectation.fulfill()
        })

        plugin.context = context
        plugin.setup(context: context)

        let hooks = try XCTUnwrap(plugin.hooks, "Hooks are not initialized")

        hooks.cancelBeacon.tap { (arg1: JSValue, _: JSValue) -> Bool in
            cancelBeaconHandler.fulfill()
            if let action = arg1.toDictionary()?["action"] as? String,
               action == BeaconAction.clicked.rawValue {
                return true
            }
            return false
        }

        plugin.beacon(assetBeacon: AssetBeacon(
            action: BeaconAction.clicked.rawValue,
            element: BeaconElement.button.rawValue,
            asset: BeaconableAsset(id: "test"),
            data: .string(data: "example")
        ))

        wait(for: [handlerExpectation, cancelBeaconHandler], timeout: 10)
    }

    func testBuildSpecificBeaconsUsingHooks() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)
        let buildBeaconHandler = expectation(description: "Build Beacon Handler called")
        let handlerExpectation = expectation(description: "Handler called")
        handlerExpectation.expectedFulfillmentCount = 1

        var handlerCallCount = 0

        let plugin = BaseBeaconPlugin<DefaultBeacon>(onBeacon: { beacon in
            handlerCallCount += 1
            XCTAssertEqual(beacon.assetId, "test")
            XCTAssertEqual(beacon.element, BeaconElement.button.rawValue)
            switch beacon.data {
            case let .string(string):
                XCTAssertEqual(string, "modified example")
            default:
                XCTFail("beacon data was not a string")
            }
            handlerExpectation.fulfill()
        })

        plugin.context = context
        plugin.setup(context: context)

        let hooks = try XCTUnwrap(plugin.hooks, "Hooks are not initialized")

        hooks.buildBeacon.tap { (arg1: JSValue, _: JSValue) -> JSValue? in
            buildBeaconHandler.fulfill()
            if var actionDict = arg1.toDictionary() as? [String: Any],
               let action = actionDict["action"] as? String,
               action == BeaconAction.clicked.rawValue {
                actionDict["data"] = "modified example"
                return JSValue(object: actionDict, in: arg1.context)
            }
            return nil
        }

        plugin.beacon(assetBeacon: AssetBeacon(
            action: BeaconAction.clicked.rawValue,
            element: BeaconElement.button.rawValue,
            asset: BeaconableAsset(id: "test"),
            data: .string(data: "example")
        ))

        wait(for: [handlerExpectation, buildBeaconHandler], timeout: 10)

        // Assert that the handler was called exactly once
        XCTAssertEqual(handlerCallCount, 1)
    }

    /// Verifies `BaseBeaconPlugin.teardown()` also releases `hooks` (which hold the old
    /// `pluginRef`) and tears down child plugins, so none keep the old JSContext reachable.
    func testTeardownReleasesHooksAndChildPlugins() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)
        let child = BPPlugin(fileName: "", pluginName: "")
        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: [child]) { _ in }
        plugin.context = context

        XCTAssertNotNil(plugin.hooks)
        XCTAssertNotNil(child.context)

        plugin.teardown()

        XCTAssertNil(plugin.hooks, "hooks hold the old pluginRef and must be released")
        XCTAssertNil(plugin.pluginRef)
        XCTAssertNil(plugin.context)
        XCTAssertNil(child.context, "child beacon plugins must be torn down too")
    }

    /// Regression test for PLAYA-10711: a late `beacon(assetBeacon:)` call after teardown
    /// (e.g. a delayed input callback) must no-op instead of invoking a torn-down JSContext.
    func testBeaconAfterTeardownIsNoOp() throws {
        let context = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(context)

        let beaconed = expectation(description: "Beacon not sent")
        beaconed.isInverted = true

        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: []) { _ in beaconed.fulfill() }
        plugin.context = context
        plugin.teardown()

        plugin.beacon(assetBeacon: AssetBeacon(
            action: "action",
            element: "element",
            asset: BeaconableAsset(id: "id")
        ))
        wait(for: [beaconed], timeout: 0.5)
    }

    /// Plugins are reused across flows: Context tears them down on unload/load and the next
    /// `load()` re-applies them to a fresh context. `callback` is only set in `init`, so
    /// `teardown()` must keep it, or beacons silently stop after the first flow.
    func testBeaconCallbackSurvivesTeardownAndReapply() throws {
        let beaconed = expectation(description: "Beacon delivered after re-apply")
        let plugin = BaseBeaconPlugin<DefaultBeacon>(plugins: []) { _ in beaconed.fulfill() }

        let first = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(first)
        plugin.context = first
        plugin.teardown()

        let second = try XCTUnwrap(JSContext())
        JSUtilities.polyfill(second)
        plugin.context = second

        XCTAssertNotNil(plugin.callback, "teardown() must not drop the host callback")
        plugin.beacon(assetBeacon: AssetBeacon(
            action: "action",
            element: "element",
            asset: BeaconableAsset(id: "id")
        ))
        wait(for: [beaconed], timeout: 1)
    }
}
