//
//  String + Extensions.swift
//  PlayerUI-UI-XCUITests
//
//  Created by Zhao Xia Wu on 2023-11-01.
//

import Foundation

// mocks for managed player flows
extension String {
    static let firstFlow: String =
        """
        {
          "id": "flow_1",
          "views": [
            {
              "id": "first_view",
              "type": "action",
              "value": "flow_1",
              "label": {
                "asset": {
                  "id": "next-view-label",
                  "type": "text",
                  "value": "End Flow 1"
                }
              }
            }
          ],
          "navigation": {
            "BEGIN": "flow_1",
            "flow_1": {
              "startState": "view_1",
              "view_1": {
                "state_type": "VIEW",
                "ref": "first_view",
                "transitions": {
                  "*": "END_Done"
                }
              },
              "END_Done": {
                "state_type": "END",
                "outcome": "done"
              }
            }
          }
        }
        """

    static let secondFlow: String =
            """
            {
              "id": "flow_2",
              "views": [
                {
                  "id": "second_view",
                  "type": "action",
                  "value": "flow_2",
                  "label": {
                    "asset": {
                      "id": "next-view-label",
                      "type": "text",
                      "value": "End View 2"
                    }
                  }
                }
              ],
              "navigation": {
                "BEGIN": "flow_2",
                "flow_2": {
                  "startState": "view_2",
                  "view_2": {
                    "state_type": "VIEW",
                    "ref": "second_view",
                    "transitions": {
                      "*": "END_Done"
                    }
                  },
                  "END_Done": {
                    "state_type": "END",
                    "outcome": "done"
                  }
                }
              }
            }
            """

    static let errorFlow =
                """
                {
                  "id": "flow_2",
                  "views": [
                    {
                      "id": "second_view",
                      "type": "action",
                      "exp": "{{foo.bar..}",
                      "value": "end",
                      "label": {
                        "asset": {
                          "id": "next-view-label",
                          "type": "text",
                          "value": "End View 2"
                        }
                      }
                    }
                  ],
                  "navigation": {
                    "BEGIN": "flow_2",
                    "flow_2": {
                      "startState": "view_2",
                      "view_2": {
                        "state_type": "VIEW",
                        "ref": "second_view",
                        "transitions": {
                          "*": "END_Done"
                        }
                      },
                      "END_Done": {
                        "state_type": "END",
                        "outcome": "done"
                      }
                    }
                  }
                }
                """

    static let assetErrorFlow =
             """
             {
               "id": "flow_3",
               "views": [
                 {
                   "id": "third_view",
                   "type": "error"
                 }
               ],
               "navigation": {
                 "BEGIN": "flow_3",
                 "flow_3": {
                   "startState": "view_3",
                   "view_3": {
                     "state_type": "VIEW",
                     "ref": "third_view",
                     "transitions": {
                       "*": "END_Done"
                     }
                   },
                   "END_Done": {
                     "state_type": "END",
                     "outcome": "done"
                   }
                 }
               }
             }
             """
}