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

class ExternalActionViewModifierPluginTests: ViewInspectorTestCase {
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
        let plugin = ExternalActionViewModifierPlugin<ExternalStateSheetModifier> { (state, _, transition) in
            XCTAssertEqual(state.transitions, ["Next": "END_FWD", "Prev": "END_BCK"])
            XCTAssertEqual(state.ref, "test-1")
            // Test out subscript fetching additional properties
            let extra: String? = state.extraProperty
            XCTAssertEqual(extra, "extraValue")
            handlerExpectation.fulfill()
            return AnyView(Text("External State").onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    transition("Next")
                }
            })
        }

        let context = SwiftUIPlayer.Context()

        let player = SwiftUIPlayer(flow: json, plugins: [PrintLoggerPlugin(level: .debug), ReferenceAssetsPlugin(), plugin], result: Binding(get: {nil}, set: { (result) in
            print("RESULT \(String(describing: result))")
            switch result {
            case .success:
                completionExpectation.fulfill()
            default:
                break
            }
        }), context: context, unloadOnDisappear: false)

        ViewHosting.host(view: player)

        let exp = player.inspection.inspect(after: 0.5) { view in
            XCTAssertNotNil(plugin.state)
            let content = try view.vStack().first?.anyView().anyView().modifier(ExternalStateSheetModifier.self).viewModifierContent()
            try content?.sheet().anyView().text().callOnAppear()
        }

        wait(for: [handlerExpectation], timeout: 5)
        wait(for: [exp], timeout: 5)
        wait(for: [completionExpectation], timeout: 5)
        XCTAssertNil(plugin.state)

        ViewHosting.expel()
    }

    func testExternalStateHandlingThrowsError() throws {
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

        let player = SwiftUIPlayer(flow: json, plugins: [ReferenceAssetsPlugin(), plugin], result: Binding(get: {nil}, set: { (result) in
            guard result != nil else { return }
            switch result {
            case .success:
                XCTFail("Should have failed")
            case .failure:
                completionExpectation.fulfill()
            default: break
            }
        }))

        ViewHosting.host(view: player)

        wait(for: [handlerExpectation, completionExpectation], timeout: 10)

        ViewHosting.expel()
    }
}

extension ExternalStateSheetModifier: Inspectable {}
extension InspectableSheet: PopupPresenter {}
