//
//  String + Extensions.swift
//  PlayerUI-UI-XCUITests
//
//  Created by Zhao Xia Wu on 2023-11-01.
//

import Foundation

/// mocks for managed player flows. Generally, we should not store flows in Swift files---instead
/// put them in appropriate shared mock folders. HOWEVER these flows are used directly in a
/// way that would make that annoying, so these were left here when ios migrated to using the
/// same shared mocks as everybody else.
extension String {
    static let externalStateFlow = """
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

    static let multiViewTransitionFlow: String =
        """
        {
          "id": "modal-flow",
          "views": [
                      {
                        "id": "view-1",
                        "type": "action",
                        "value": "Next",
                        "label": {
                          "asset": {
                            "id": "action-label",
                            "type": "text",
                            "value": "Count: {{count}}"
                          }
                        }

            },
            {
              "id": "view-2",
              "type": "info",
              "title": {
                "asset": {
                  "id": "view-title",
                  "type": "text",
                  "value": "View 2"
                }
              },
              "actions": [
                {
                  "asset": {
                    "id": "view-2-action-1",
                    "type": "action",
                    "value": "Next",
                    "label": {
                      "asset": {
                        "id": "action-1-label",
                        "type": "text",
                        "value": "Next"
                      }
                    }
                  }
                },
                {
                  "asset": {
                    "id": "view-2-action-2",
                    "type": "action",
                    "value": "Dismiss",
                    "label": {
                      "asset": {
                        "id": "action-1-label",
                        "type": "text",
                        "value": "Dismiss"
                      }
                    }
                  }
                }
              ]
            },
            {
              "id": "view-3",
              "type": "info",
              "title": {
                "asset": {
                  "id": "view-3-title",
                  "type": "text",
                  "value": "View 3"
                }
              },
              "actions": [
                {
                  "asset": {
                    "id": "view-3-action-1",
                    "type": "action",
                    "value": "Next",
                    "label": {
                      "asset": {
                        "id": "action-3-label",
                        "type": "text",
                        "value": "Next"
                      }
                    }
                  }
                }
              ]
            }
          ],
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_2",
                    "END_Done": {
                      "state_type": "END",
                      "outcome": "done"
                    },
              "VIEW_1": {
                "state_type": "VIEW",
                "ref": "view-1",
                "transitions": {
                  "*": "VIEW_2"
                }
              },
              "VIEW_2": {
                "state_type": "VIEW",
                "ref": "view-2",
                "attributes": {
                  "stacked": false
                },
                "transitions": {
                  "Next": "VIEW_3",
                  "Dismiss": "VIEW_1"
                }
              },
              "ACTION_2": {
                 "state_type": "ACTION",
                 "exp": "{{foo}}",
                 "transitions": {
                    "*": "END_Done"
                  }
                },
              "VIEW_3": {
                "state_type": "VIEW",
                "ref": "view-3",
                "transitions": {
                  "*": "ACTION_2"
                }
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

    static let firstFlowAction: String =
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
                              "startState": "ACTION_2",
                              "view_2": {
                                "state_type": "VIEW",
                                "ref": "second_view",
                                "transitions": {
                                  "*": "END_Done"
                                }
                              },
                                     "ACTION_2": {
                                       "state_type": "ACTION",
                                       "exp": "{{foo}}",
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

    static let endStateReproFlow: String = """
    {
      "id": "end-state-repro-flow-1",
      "views": [
        {
          "id": "view-1",
          "type": "collection",
          "label": {
            "asset": {
              "id": "title",
              "type": "text",
              "value": "Flow 1 - Click End to complete this flow"
            }
          },
          "values": [
            {
              "asset": {
                "id": "action-end",
                "type": "action",
                "value": "End",
                "label": {
                  "asset": {
                    "id": "action-end-label",
                    "type": "text",
                    "value": "End Flow 1 (loads Flow 2 next)"
                  }
                }
              }
            }
          ]
        }
      ],
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "startState": "ACTION_1",
          "ACTION_1": {
            "state_type": "ACTION",
            "exp": "{{foo}} = 1",
            "transitions": {
              "*": "VIEW_1"
            }
          },
          "VIEW_1": {
            "state_type": "VIEW",
            "ref": "view-1",
            "transitions": {
              "End": "END_Done"
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

    static let secondFlowAction: String =
        """
                        {
                          "id": "flow_3",
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
                              "startState": "ACTION_2",
                              "view_2": {
                                "state_type": "VIEW",
                                "ref": "second_view",
                                "transitions": {
                                  "*": "END_Done"
                                }
                              },
                                     "ACTION_2": {
                                       "state_type": "ACTION",
                                       "exp": "{{foo}}",
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
