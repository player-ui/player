//
//  BaseBeaconPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 3/11/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
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

        let plugin = BaseBeaconPlugin<DefaultBeacon>() { _ in }

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
                XCTAssertEqual("example", dict["data"] as? String)
                XCTAssertEqual(3, dict["value"] as? Double)
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
            data: .anyDictionary(data: ["data": "example", "value": 3])
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
}
