//
//  ExternalStatePluginTests.swift
//  PlayerUI_Tests
//
//  Created by Borawski, Harris on 8/13/20.
//  Copyright © 2020 Intuit. All rights reserved.
//

import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUIExternalStatePlugin

// swiftlint:disable type_body_length force_try
class ExternalStatePluginTests: XCTestCase {
    // swiftlint:disable:next function_body_length
    func testExternalStateHandling() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "extraProperty": "extraValue"
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let handlerExpectation = XCTestExpectation(description: "handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStatePlugin(handlers: [
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (state, _, handler) in
                    XCTAssertEqual(state.transitions, ["Next": "END_FWD", "Prev": "END_BCK"])
                    XCTAssertEqual(state.ref, "test-1")
                    // Test out subscript fetching additional properties
                    let extra: String? = state.extraProperty
                    XCTAssertEqual(extra, "extraValue")
                    handlerExpectation.fulfill()
                    handler("Next")
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success(let state):
                XCTAssertEqual(state.endState?.outcome, "FWD")
                completionExpectation.fulfill()
            case .failure:
                XCTFail("flow failed")
            }
        }

        wait(for: [handlerExpectation, completionExpectation], timeout: 1)
    }

    // swiftlint:disable:next function_body_length
    func testExternalStateHandlingThrowsError() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "extraProperty": "extraValue"
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let handlerExpectation = XCTestExpectation(description: "handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStatePlugin(handlers: [
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (_, _, _) in
                    handlerExpectation.fulfill()
                    throw PlayerError.jsConversionFailure
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success:
                XCTFail("flow should have failed")
            case .failure:
                completionExpectation.fulfill()
            }
        }

        wait(for: [handlerExpectation, completionExpectation], timeout: 1)
    }

    // swiftlint:disable function_body_length
    // swiftlint:disable:next function_body_length
    func testExternalStateHandlingComplexState() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "param": {
                  "name": "ctg/pmec",
                  "data": {
                    "params": {
                      "upsellType": "FUS_Generic_SE",
                      "skuList": "64"
                    }
                  }
                }
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let handlerExpectation = XCTestExpectation(description: "handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStatePlugin(handlers: [
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (state, _, handler) in
                    XCTAssertEqual(state.transitions, ["Next": "END_FWD", "Prev": "END_BCK"])
                    XCTAssertEqual(state.ref, "test-1")
                    if let param: [String: Any] = state.param {
                        XCTAssertEqual(param["name"] as? String, "ctg/pmec")
                    } else {
                        XCTFail("param was not a dictionary")
                    }
                    handlerExpectation.fulfill()
                    handler("Next")
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success(let state):
                XCTAssertEqual(state.endState?.outcome, "FWD")
                completionExpectation.fulfill()
            case .failure:
                XCTFail("flow failed")
            }
        }

        wait(for: [handlerExpectation, completionExpectation], timeout: 2)
    }

    func testExternalStateHandlingWithDelay() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "extraProperty": "extraValue"
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let handlerExpectation = XCTestExpectation(description: "handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStatePlugin(handlers: [
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (_, _, handler) in
                    DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
                        handlerExpectation.fulfill()
                        handler("Next")
                    }
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success(let state):
                XCTAssertEqual(state.endState?.outcome, "FWD")
                completionExpectation.fulfill()
            case .failure:
                XCTFail("flow failed")
            }
        }

        wait(for: [handlerExpectation, completionExpectation], timeout: 5)
    }

    func testExternalStateHandlingOptions() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "extraProperty": "extraValue"
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let handlerExpectation = XCTestExpectation(description: "handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStatePlugin(handlers: [
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (_, options, handler) in
                    XCTAssertEqual(options.data.get(binding: "transitionValue") as? String, "Next")

                    // Test expression evaluation

                    options.expression.evaluate("{{transitionValue}} = 'Prev'")
                    XCTAssertEqual(options.data.get(binding: "transitionValue") as? String, "Prev")

                    options.expression.evaluate(["{{transitionValue}} = 'Previous'", "{{transitionValue}} = 'Next'"])
                    XCTAssertEqual(options.data.get(binding: "transitionValue") as? String, "Next")
                    handlerExpectation.fulfill()
                    handler("Next")
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success(let state):
                XCTAssertEqual(state.endState?.outcome, "FWD")
                completionExpectation.fulfill()
            case .failure:
                XCTFail("flow failed")
            }
        }

        wait(for: [handlerExpectation, completionExpectation], timeout: 1)
    }

    // swiftlint:disable:next function_body_length
    func testExternalStateHandlingWithSpecificity() {
        let json = """
        {
          "id": "test-flow",
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "END_FWD",
                  "Prev": "END_BCK"
                },
                "extraProperty": "extraValue"
              },
              "END_FWD": {
                "state_type": "END",
                "outcome": "FWD"
              },
              "END_BCK": {
                "state_type": "END",
                "outcome": "BCK"
              }
            }
          }
        }
        """

        let lessSpecificExpectation = XCTestExpectation(description: "less specific handler should not be called")
        lessSpecificExpectation.isInverted = true
        let moreSpecificExpectation = XCTestExpectation(description: "more specific handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")

        let plugin = ExternalStatePlugin(handlers: [
            // Less specific - only matches ref
            ExternalStateHandler(
                ref: "test-1",
                handlerFunction: { (_, _, handler) in
                    lessSpecificExpectation.fulfill()
                    handler("Prev")
                }
            ),
            // More specific - matches ref and extraProperty
            ExternalStateHandler(
                ref: "test-1",
                match: ["extraProperty": "extraValue"],
                handlerFunction: { (_, _, handler) in
                    moreSpecificExpectation.fulfill()
                    handler("Next")
                }
            )
        ])
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: json) { (result) in
            switch result {
            case .success(let state):
                // More specific handler should have been called, returning "Next" -> outcome "FWD"
                XCTAssertEqual(state.endState?.outcome, "FWD")
                completionExpectation.fulfill()
            case .failure:
                XCTFail("flow failed")
            }
        }

        wait(for: [moreSpecificExpectation, lessSpecificExpectation, completionExpectation], timeout: 1)
    }
}
