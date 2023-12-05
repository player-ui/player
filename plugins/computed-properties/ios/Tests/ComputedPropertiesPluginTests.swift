import Foundation
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUIInternalTestUtilities
@testable import PlayerUIComputedPropertiesPlugin

class ComputedPropertiesPluginTests: XCTestCase {
    func testPluginConstructs() {
        let context = JSContext()

        let plugin = ComputedPropertiesPlugin()
        plugin.context = context

        XCTAssertNotNil(plugin.pluginRef)
    }

    func testPluginSimple() {
        let player = HeadlessPlayerImpl(plugins: [ComputedPropertiesPlugin()])

        let flow = """
        {
          "id": "generated-flow",
          "views": [],
          "schema": {
            "ROOT": {
              "foo": {
                "type": "FooType"
              }
            },
            "FooType": {
              "computedValue": {
                "type": "Expression",
                "exp": "1 + 2 + 3"
              }
            }
          },
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "state_type": "ACTION",
                "exp": "true",
                "transitions": {
                  "*": "END_Done"
                }
              },
              "END_Done": {
                "state_type": "END",
                "outcome": "{{foo.computedValue}}"
              }
            }
          }
        }

        """

        let expectation = XCTestExpectation(description: "Computed Property Calculated")

        player.start(flow: flow) { result in
            guard
                case .success(let success) = result
            else {
                return XCTFail("Flow Failed")
            }

            XCTAssertEqual("6", success.endState?.outcome)
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 1)

    }
}
