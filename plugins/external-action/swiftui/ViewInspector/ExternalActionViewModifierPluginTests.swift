//
//  ExternalActionViewModifierPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/19/21.
//  Copyright © 2021 CocoaPods. All rights reserved.
//
import Foundation
import XCTest
import JavaScriptCore
import Combine
import SwiftUI
import ViewInspector
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUISwiftUI
@testable import PlayerUIReferenceAssets
@testable import PlayerUIExternalActionViewModifierPlugin

class ExternalActionViewModifierPluginTests: XCTestCase {
    override func setUp() {
        XCUIApplication().terminate()
    }
    // swiftlint:disable function_body_length
    func testExternalStateHandling() throws {
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
        let renderExpectation = XCTestExpectation(description: "external view rendered")
        let plugin = ExternalActionViewModifierPlugin<ExternalStateSheetModifier> { (state, _, transition) in
            XCTAssertEqual(state.transitions, ["Next": "END_FWD", "Prev": "END_BCK"])
            XCTAssertEqual(state.ref, "test-1")
            // Test out subscript fetching additional properties
            let extra: String? = state.extraProperty
            XCTAssertEqual(extra, "extraValue")
            handlerExpectation.fulfill()
            return AnyView(
                Text("External State")
                    .onDisappear {
                        transition("Next")
                    }
                    .onAppear {
                        renderExpectation.fulfill()
                    }
            )
        }

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(flow: json, plugins: [ReferenceAssetsPlugin(), plugin], result: Binding(get: {nil}, set: { (result) in
            switch result {
            case .success:
                completionExpectation.fulfill()
            default:
                break
            }
        }), context: context, unloadOnDisappear: false)

        ViewHosting.host(view: player)

        wait(for: [renderExpectation, handlerExpectation], timeout: 10)

        XCTAssertNotNil(plugin.state)
        let content = try player.inspect().vStack().first?.anyView().anyView().modifier(ExternalStateSheetModifier.self).viewModifierContent()
        try content?.sheet().anyView().text().callOnDisappear()

        wait(for: [completionExpectation], timeout: 10)
        XCTAssertNil(plugin.state)

        ViewHosting.expel()
    }

    // swiftlint:disable function_body_length
    func testExternalStateHandlingForcedTransition() throws {
        let json = """
        {
          "id": "test-flow",
          "views": [
            {
              "id": "view-1",
              "type": "text",
              "value": "View 1"
            }
          ],
          "data": {
            "transitionValue": "Next"
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "EXT_1",
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "view-1",
                "transitions": {
                  "*": "END_FWD"
                }
              },
              "EXT_1": {
                "state_type": "EXTERNAL",
                "ref": "test-1",
                "transitions": {
                  "Next": "VIEW_1",
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
        let renderExpectation = XCTestExpectation(description: "external view rendered")
        let plugin = ExternalActionViewModifierPlugin<ExternalStateSheetModifier> { (state, _, transition) in
            XCTAssertEqual(state.transitions, ["Next": "VIEW_1", "Prev": "END_BCK"])
            XCTAssertEqual(state.ref, "test-1")
            // Test out subscript fetching additional properties
            let extra: String? = state.extraProperty
            XCTAssertEqual(extra, "extraValue")
            handlerExpectation.fulfill()
            return AnyView(Text("External State").onAppear { renderExpectation.fulfill() })
        }
        class HasTransitionedPlugin: NativePlugin {
            var pluginName: String = "HasTransitioned"

            var expected: String

            var expectation: XCTestExpectation

            init(expected: String, expectation: XCTestExpectation) {
                self.expected = expected
                self.expectation = expectation
            }

            func apply<P>(player: P) where P : HeadlessPlayer {
                player.hooks?.flowController.tap({ flowController in
                    flowController.hooks.flow.tap { flow in
                        flow.hooks.afterTransition.tap { [weak self] newFlow in
                            if newFlow.currentState?.value?.stateType == self?.expected {
                                self?.expectation.fulfill()
                            }
                        }
                    }
                })
            }
        }

        let viewTransition = XCTestExpectation(description: "Transition to VIEW state")

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(flow: json, plugins: [ReferenceAssetsPlugin(), plugin, HasTransitionedPlugin(expected: "VIEW", expectation: viewTransition)], result: Binding(get: {nil}, set: { (result) in
            switch result {
            case .success:
                completionExpectation.fulfill()
            default:
                break
            }
        }), context: context, unloadOnDisappear: false)

        ViewHosting.host(view: player)

        wait(for: [renderExpectation, handlerExpectation], timeout: 10)

        XCTAssertNotNil(plugin.state)
        let content = try player.inspect().vStack().first?.anyView().anyView().modifier(ExternalStateSheetModifier.self).viewModifierContent()
        let value = try content?.sheet().anyView().text().string()
        XCTAssertEqual(value, "External State")
        do {
            try (view.actionView().state as? InProgressState)?.controllers?.flow.transition(with: "Next")
        } catch {
            XCTFail("Transition with 'Next' failed")
        }

        wait(for: [viewTransition], timeout: 10)
        let state = player.state as? InProgressState
        XCTAssertNotNil(state)
        XCTAssertEqual(state?.controllers?.flow.current?.currentState?.value?.stateType, "VIEW")
        XCTAssertNil(plugin.state)
        XCTAssertFalse(plugin.isExternalState)
        do {
            try state?.controllers?.flow.transition(with: "Next")
        } catch {
            XCTFail("Transition with 'Next' failed")
        }
        wait(for: [completionExpectation], timeout: 10)

        ViewHosting.expel()
    }

    func skiptestExternalStateHandlingThrowsError() throws {
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
        let plugin = ExternalActionViewModifierPlugin<ExternalStateSheetModifier> { (_, _, _) in
            handlerExpectation.fulfill()
            throw PlayerError.jsConversionFailure
        }

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(flow: json, plugins: [ReferenceAssetsPlugin(), plugin], result: Binding(get: {nil}, set: { (result) in
            guard result != nil else { return }
            switch result {
            case .success:
                XCTFail("Should have failed")
            default:
                completionExpectation.fulfill()
            }
        }), context: context, unloadOnDisappear: false)

        ViewHosting.host(view: player)

        wait(for: [handlerExpectation, completionExpectation], timeout: 10)

        ViewHosting.expel()
    }
}

extension InspectableSheet: PopupPresenter {}
extension Inspection: InspectionEmissary { }
