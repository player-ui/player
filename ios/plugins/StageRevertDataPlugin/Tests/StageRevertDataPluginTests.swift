import Foundation
import XCTest
@testable import PlayerUI

class StageRevertDataPluginTests: XCTestCase {
    let json = """
    {
      "id": "minimal",
      "views": [
        {
          "id": "view-1",
          "type": "text",
          "value": "{{name}}"
        },
        {
          "id": "view-2",
          "type": "text",
          "value": "{{name}}"
        },
        {
          "id": "view-3",
          "type": "text",
          "value": "{{name}}"
        }
      ],
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "VIEW_1": {
            "ref": "view-1",
            "state_type": "VIEW",
            "transitions": {
              "clear": "VIEW_3",
              "commit": "VIEW_2",
              "*": "END_Done"
            },
            "attributes": {
              "stageData": true,
              "commitTransitions": ["VIEW_2"]
            }
          },
          "VIEW_2": {
            "ref": "view-2",
            "state_type": "VIEW",
            "transitions": {
              "*": "END_Done"
            }
          },
          "VIEW_3": {
            "ref": "view-3",
            "state_type": "VIEW",
            "transitions": {
              "*": "END_Done"
            }
          },
          "startState": "VIEW_1"
        }
      },
      "data": {
        "name": "default"
      }
    }
    """
    
    func testStageRevertDataPluginStagesData() {
        let expected = XCTestExpectation(description: "data did not change")
        let player = HeadlessPlayerImpl(plugins: [PrintLoggerPlugin(level: .trace), StageRevertDataPlugin()])

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { value in
                    guard view.id == "view-3" else {
                        return
                    }

                    let labelValue = value.objectForKeyedSubscript("value").toString()

                    XCTAssertEqual(labelValue, "default")
                    expected.fulfill()
                }
            }
        }

        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.afterTransition.tap { flowInstance in
                    guard flowInstance.currentState?.name == "VIEW_3" else {
                        (player.state as? InProgressState)?.controllers?.data.set(transaction: ["name": "Test"])
                        flowController.transition(with: "clear")
                        return
                    }
                }
            }
        })

        player.start(flow: json, completion: {_ in})
        wait(for: [expected], timeout: 1)
    }

    func testStageRevertDataPluginCommitsData() {
        let expected = XCTestExpectation(description: "data did not change")
        let player = HeadlessPlayerImpl(plugins: [PrintLoggerPlugin(level: .trace), StageRevertDataPlugin()])

        player.hooks?.viewController.tap { viewController in
            viewController.hooks.view.tap { view in
                view.hooks.onUpdate.tap { value in
                    guard view.id == "view-2" else {
                        return
                    }

                    let labelValue = value.objectForKeyedSubscript("value").toString()

                    XCTAssertEqual(labelValue, "Test")
                    expected.fulfill()
                }
            }
        }

        player.hooks?.flowController.tap({ flowController in
            flowController.hooks.flow.tap { flow in
                flow.hooks.afterTransition.tap { flowInstance in
                    guard flowInstance.currentState?.name == "VIEW_2" else {
                        (player.state as? InProgressState)?.controllers?.data.set(transaction: ["name": "Test"])
                        flowController.transition(with: "commit")
                        return
                    }
                }
            }
        })

        player.start(flow: json, completion: {_ in})
        wait(for: [expected], timeout: 1)
    }
}
