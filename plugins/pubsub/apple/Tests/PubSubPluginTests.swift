//
//  PubSubPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 4/17/20.
//  Copyright © 2020 CocoaPods. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUIPubSubPlugin

class PubSubPluginTests: XCTestCase {
    func testPubSubPluginFromContent() {
        let flow = """
            {
              "id": "custom",
              "views": [
                {
                  "id": "view-1",
                  "type": "text",
                  "value": ""
                }
              ],
              "navigation": {
                "BEGIN": "FLOW_1",
                "FLOW_1": {
                  "onStart": "publish('test', 'example')",
                  "startState": "VIEW_1",
                  "VIEW_1": {
                    "ref": "view-1",
                    "state_type": "VIEW",
                    "transitions": {
                      "Next": "VIEW_2",
                      "*": "END_Done"
                    }
                  }
                }
              }
            }
        """

        let expectation = XCTestExpectation(description: "publish callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .string(let result):
                XCTAssertEqual(result, "example")
            default:
                XCTFail("data was not a string")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription])
        let player = HeadlessPlayerImpl(plugins: [plugin])
        player.start(flow: flow, completion: {_ in})
        wait(for: [expectation], timeout: 3)
    }

    func testPubSubPluginFromContentWithCustomName() {
        let flow = """
            {
              "id": "custom",
              "views": [
                {
                  "id": "view-1",
                  "type": "text",
                  "value": ""
                }
              ],
              "navigation": {
                "BEGIN": "FLOW_1",
                "FLOW_1": {
                  "onStart": "customPublish('test', 'example')",
                  "startState": "VIEW_1",
                  "VIEW_1": {
                    "ref": "view-1",
                    "state_type": "VIEW",
                    "transitions": {
                      "Next": "VIEW_2",
                      "*": "END_Done"
                    }
                  }
                }
              }
            }
        """

        let expectation = XCTestExpectation(description: "publish callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .string(let result):
                XCTAssertEqual(result, "example")
            default:
                XCTFail("data was not a string")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription], options: PubSubPluginOptions(expressionName: "customPublish"))
        let player = HeadlessPlayerImpl(plugins: [plugin])
        player.start(flow: flow, completion: {_ in})
        wait(for: [expectation], timeout: 3)
    }
    func testPubSubPluginStringData() {
        let context = JSContext()!
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .string(let result):
                XCTAssertEqual(result, "example")
            default:
                XCTFail("data was not a string")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription])
        plugin.context = context

        plugin.publish(eventName: "test", eventData: .string(data: "example"))
        wait(for: [expectation], timeout: 2)
    }

    func testPubSubPluginArrayData() {
        let context = JSContext()!
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .array(let result):
                XCTAssertEqual(result, ["example", "data"])
            default:
                XCTFail("data was not an array")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription])
        plugin.context = context

        plugin.publish(eventName: "test", eventData: .array(data: ["example", "data"]))
        wait(for: [expectation], timeout: 2)
    }

    func testPubSubPluginDictionaryData() {
        let context = JSContext()!
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .dictionary(let result):
                XCTAssertEqual(result, ["example": "data"])
            default:
                XCTFail("data was not a dictionary")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription])
        plugin.context = context

        plugin.publish(eventName: "test", eventData: .dictionary(data: ["example": "data"]))
        wait(for: [expectation], timeout: 2)
    }

    func testPubSubPluginAnyDictionaryData() {
        let context = JSContext()!
        JSUtilities.polyfill(context)

        let expectation = XCTestExpectation(description: "beacon callback called")
        let subscription: PubSubSubscription = ("test", { (_, data) in
            guard let eventData = data else { return XCTFail("data did not exist") }
            switch eventData {
            case .anyDictionary(let dict):
                XCTAssertEqual(2, dict.keys.count)
                XCTAssertEqual("example", dict["data"] as? String)
                XCTAssertEqual(3, dict["value"] as? Double)
            default:
                XCTFail("data was not anyDictionary")
            }
            expectation.fulfill()
        })

        let plugin = PubSubPlugin([subscription])
        plugin.context = context

        plugin.publish(eventName: "test", eventData: .anyDictionary(data: ["data": "example", "value": 3]))
        wait(for: [expectation], timeout: 2)
    }
}
