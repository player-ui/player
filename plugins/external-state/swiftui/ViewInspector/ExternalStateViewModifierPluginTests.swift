//
//  ExternalStateViewModifierPluginTests.swift
//  PlayerUI_Tests
//
//  Created by Harris Borawski on 8/19/21.
//  Copyright © 2021 Intuit. All rights reserved.
//
import Combine
import Foundation
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIExternalStatePlugin
@testable import PlayerUIExternalStateViewModifierPlugin
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIReferenceAssets
@testable import PlayerUISwiftUI
import SwiftUI
import ViewInspector
import XCTest

// swiftlint:disable type_body_length force_try
class ExternalStateViewModifierPluginTests: XCTestCase {
    // swiftlint:disable:next function_body_length
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
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            .init(
                ref: "test-1",
                handlerFunction: { state, _, transition in
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
            ),
        ])

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(
            flow: json,
            plugins: [ReferenceAssetsPlugin(), plugin],
            result: Binding(get: { nil }, set: { result in
                switch result {
                case .success:
                    completionExpectation.fulfill()
                default:
                    break
                }
            }), context: context, unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [renderExpectation, handlerExpectation], timeout: 10)

        XCTAssertNotNil(plugin.state)
        let content = try player.inspect()
            .vStack()
            .first?
            .anyView()
            .anyView()
            .modifier(ExternalStateSheetModifier.self)
            .viewModifierContent()
        try content?.sheet().anyView().text().callOnDisappear()

        wait(for: [completionExpectation], timeout: 10)
        XCTAssertNil(plugin.state)

        ViewHosting.expel()
    }

    // swiftlint:disable:next function_body_length
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
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            .init(
                ref: "test-1",
                handlerFunction: { state, _, _ in
                    XCTAssertEqual(state.transitions, ["Next": "VIEW_1", "Prev": "END_BCK"])
                    XCTAssertEqual(state.ref, "test-1")
                    // Test out subscript fetching additional properties
                    let extra: String? = state.extraProperty
                    XCTAssertEqual(extra, "extraValue")
                    handlerExpectation.fulfill()
                    return AnyView(Text("External State").onAppear { renderExpectation.fulfill() })
                }
            ),
        ])
        class HasTransitionedPlugin: NativePlugin {
            var pluginName: String = "HasTransitioned"

            var expected: NavigationFlowStateType

            var expectation: XCTestExpectation

            init(expected: NavigationFlowStateType, expectation: XCTestExpectation) {
                self.expected = expected
                self.expectation = expectation
            }

            func apply(player: some HeadlessPlayer) {
                player.hooks?.flowController.tap { flowController in
                    flowController.hooks.flow.tap { flow in
                        flow.hooks.afterTransition.tap { [weak self] newFlow in
                            if newFlow.currentState?.value?.stateType == self?.expected {
                                self?.expectation.fulfill()
                            }
                        }
                    }
                }
            }
        }

        let viewTransition = XCTestExpectation(description: "Transition to VIEW state")

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(
            flow: json,
            plugins: [
                ReferenceAssetsPlugin(),
                plugin,
                HasTransitionedPlugin(expected: .view, expectation: viewTransition),
            ],
            result: Binding(get: { nil }, set: { result in
                switch result {
                case .success:
                    completionExpectation.fulfill()
                default:
                    break
                }
            }), context: context, unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [renderExpectation, handlerExpectation], timeout: 10)

        XCTAssertNotNil(plugin.state)
        let content = try player.inspect()
            .vStack()
            .first?
            .anyView()
            .anyView()
            .modifier(ExternalStateSheetModifier.self)
            .viewModifierContent()
        let value = try content?.sheet().anyView().text().string()
        XCTAssertEqual(value, "External State")
        try (player.state as? InProgressState)?.controllers?.flow.transition(with: "Next")

        wait(for: [viewTransition], timeout: 10)
        let state = player.state as? InProgressState
        XCTAssertNotNil(state)
        XCTAssertEqual(state?.controllers?.flow.current?.currentState?.value?.stateType, .view)
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
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            .init(
                ref: "test-1",
                handlerFunction: { _, _, _ in
                    handlerExpectation.fulfill()
                    throw PlayerError.jsConversionFailure
                }
            ),
        ])

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(
            flow: json,
            plugins: [ReferenceAssetsPlugin(), plugin],
            result: Binding(get: { nil }, set: { result in
                guard result != nil else { return }
                switch result {
                case .success:
                    XCTFail("Should have failed")
                default:
                    completionExpectation.fulfill()
                }
            }), context: context, unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [handlerExpectation, completionExpectation], timeout: 10)

        ViewHosting.expel()
    }

    // swiftlint:disable:next function_body_length
    func testExternalStateHandlingWithSpecificity() throws {
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

        let lessSpecificExpectation =
            XCTestExpectation(description: "less specific handler should not be called")
        lessSpecificExpectation.isInverted = true
        let moreSpecificExpectation = XCTestExpectation(description: "more specific handler called")
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let renderExpectation = XCTestExpectation(description: "external view rendered")

        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            // Less specific - only matches ref
            .init(
                ref: "test-1",
                handlerFunction: { _, _, transition in
                    lessSpecificExpectation.fulfill()
                    return AnyView(
                        Text("Less Specific")
                            .onDisappear {
                                transition("Prev")
                            }
                    )
                }
            ),
            // More specific - matches ref and extraProperty
            .init(
                ref: "test-1",
                match: ["extraProperty": "extraValue"],
                handlerFunction: { _, _, transition in
                    moreSpecificExpectation.fulfill()
                    return AnyView(
                        Text("More Specific")
                            .onDisappear {
                                transition("Next")
                            }
                            .onAppear {
                                renderExpectation.fulfill()
                            }
                    )
                }
            ),
        ])

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(
            flow: json,
            plugins: [ReferenceAssetsPlugin(), plugin],
            result: Binding(get: { nil }, set: { result in
                switch result {
                case let .success(completed):
                    // More specific handler should have been called, returning "Next" -> outcome
                    // "FWD"
                    XCTAssertEqual(completed.endState?.outcome, "FWD")
                    completionExpectation.fulfill()
                default:
                    break
                }
            }), context: context, unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [renderExpectation, moreSpecificExpectation], timeout: 10)

        XCTAssertNotNil(plugin.state)
        let content = try player.inspect()
            .vStack()
            .first?
            .anyView()
            .anyView()
            .modifier(ExternalStateSheetModifier.self)
            .viewModifierContent()
        try content?.sheet().anyView().text().callOnDisappear()

        wait(for: [lessSpecificExpectation, completionExpectation], timeout: 10)
        XCTAssertNil(plugin.state)

        ViewHosting.expel()
    }

    // MARK: - Error Handling with Error Controller

    func testMissingHandlerNavigatesViaContentErrorTransitions() {
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [])

        let player = SwiftUIPlayer(
            flow: .flowWithErrorTransitions,
            plugins: [ReferenceAssetsPlugin(), plugin],
            result: Binding(get: { nil }, set: { result in
                switch result {
                case let .success(completed):
                    XCTAssertEqual(completed.endState?.outcome, "ERROR")
                    completionExpectation.fulfill()
                case .failure:
                    XCTFail("flow failed")
                default:
                    break
                }
            }), context: .init(), unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [completionExpectation], timeout: 10)

        ViewHosting.expel()
    }

    func testMissingTransitionValueNavigatesViaContentErrorTransitions() {
        let completionExpectation = XCTestExpectation(description: "flow completed")
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            .init(
                ref: "test-1",
                handlerFunction: { _, _, transition in
                    AnyView(Text("External State").onAppear { transition("") })
                }
            ),
        ])

        let player = SwiftUIPlayer(
            flow: .flowWithErrorTransitions,
            plugins: [ReferenceAssetsPlugin(), plugin],
            result: Binding(get: { nil }, set: { result in
                switch result {
                case let .success(completed):
                    XCTAssertEqual(completed.endState?.outcome, "ERROR")
                    completionExpectation.fulfill()
                case .failure:
                    XCTFail("flow failed")
                default:
                    break
                }
            }), context: .init(), unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [completionExpectation], timeout: 10)

        ViewHosting.expel()
    }

    func testMissingHandlerIsObservableViaOnErrorTap() {
        let onErrorCalled = XCTestExpectation(description: "onError fired")
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [])

        // SwiftUIPlayer starts the flow during init, so taps must be registered via a
        // plugin's apply() rather than after construction — otherwise the errorController
        // hook has already fired by the time the test could tap it.
        let observer = TestPlugin { errorInfo in
            XCTAssertEqual(errorInfo.type, .externalState)
            XCTAssertEqual(errorInfo.metadata?["reason"] as? String, "missing-handler")
            XCTAssertEqual(errorInfo.metadata?["ref"] as? String, "test-1")
            onErrorCalled.fulfill()
            return true // suppress default navigation
        }

        let player = SwiftUIPlayer(
            flow: .basic,
            plugins: [ReferenceAssetsPlugin(), plugin, observer],
            result: Binding(get: { nil }, set: { _ in }),
            context: .init(), unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [onErrorCalled], timeout: 10)

        ViewHosting.expel()
    }

    func testMissingTransitionValueIsObservableViaOnErrorTap() {
        let onErrorCalled = XCTestExpectation(description: "onError fired")
        let plugin = ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
            .init(
                ref: "test-1",
                handlerFunction: { _, _, transition in
                    AnyView(Text("External State").onAppear { transition("") })
                }
            ),
        ])

        let observer = TestPlugin { errorInfo in
            XCTAssertEqual(errorInfo.type, .externalState)
            XCTAssertEqual(errorInfo.metadata?["reason"] as? String, "missing-transition-value")
            XCTAssertEqual(errorInfo.metadata?["ref"] as? String, "test-1")
            onErrorCalled.fulfill()
            return true // suppress default navigation
        }

        let player = SwiftUIPlayer(
            flow: .basic,
            plugins: [ReferenceAssetsPlugin(), plugin, observer],
            result: Binding(get: { nil }, set: { _ in }),
            context: .init(), unloadOnDisappear: false
        )

        ViewHosting.host(view: player)

        wait(for: [onErrorCalled], timeout: 10)

        ViewHosting.expel()
    }

    override func setUp() {
        XCUIApplication().terminate()
    }
}

/// Registers an onError tap during `apply(player:)`, which runs before `SwiftUIPlayer`
/// starts the flow. Tapping `player.hooks?.errorController` from the test body after
/// construction is too late — the hook has already fired.
private final class TestPlugin: NativePlugin {
    let pluginName = "OnErrorObserver"

    private let onError: (JSValueError) -> Bool

    init(onError: @escaping (JSValueError) -> Bool) {
        self.onError = onError
    }

    func apply(player: some HeadlessPlayer) {
        player.hooks?.errorController.tap { [onError] errorController in
            errorController.hooks.onError.tap { errorInfo in
                onError(errorInfo)
            }
        }
    }
}

private extension String {
    /// Use the basic externalFlow (no errorTransitions); the onError tap suppresses navigation.
    static let basic = """
    {
      "id": "test-flow",
      "data": {},
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "startState": "EXT_1",
          "EXT_1": {
            "state_type": "EXTERNAL",
            "ref": "test-1",
            "transitions": {
              "Next": "END_FWD"
            }
          },
          "END_FWD": {
            "state_type": "END",
            "outcome": "FWD"
          }
        }
      }
    }
    """

    /// Flow that declares a flow-level errorTransitions mapping for `externalState`,
    /// routing missing-handler/missing-transition-value errors to `END_ERROR`.
    static let flowWithErrorTransitions = """
    {
      "id": "test-flow",
      "data": {},
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "startState": "EXT_1",
          "errorTransitions": {
            "externalState": "END_ERROR"
          },
          "EXT_1": {
            "state_type": "EXTERNAL",
            "ref": "test-1",
            "transitions": {
              "Next": "END_FWD"
            }
          },
          "END_FWD": {
            "state_type": "END",
            "outcome": "FWD"
          },
          "END_ERROR": {
            "state_type": "END",
            "outcome": "ERROR"
          }
        }
      }
    }
    """
}

extension InspectableSheet: @retroactive PopupPresenter {}
extension Inspection: InspectionEmissary {}
