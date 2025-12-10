public struct FlowData {

    static let flowAction: String =
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

    public static let COUNTER: String = """
{
  "id": "counter-flow",
  "views": [
    {
      "id": "action",
      "type": "action",
      "exp": "{{count}} = {{count}} + 1",
      "label": {
        "asset": {
          "id": "action-label",
          "type": "text",
          "value": "Clicked {{count}} times"
        }
      }
    }
  ],
  "data": {
    "count": 0
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "action",
        "transitions": {
          "*": "END_Done"
        },
        "attributes": { "test": "value" }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done",
        "param": {
          "someKey": "someValue"
        },
        "extraKey": "extraValue",
        "extraObject": {
          "someInt": 1
        }
      }
    }
  }
}
"""

    public static let externalFlow: String = """
{
  "id": "counter-flow",
  "views": [],
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "EXTERNAL_1",
      "EXTERNAL_1": {
        "state_type": "EXTERNAL",
        "ref": "action",
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

    public static let actionFlow: String = """
{
  "id": "counter-flow",
  "views": [],
  "data": {
    "count": 0
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "ACTION_1",
      "ACTION_1": {
        "state_type": "ACTION",
        "exp": "{{foo}}",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done",
        "param": {
          "someKey": "someValue"
        },
        "extraKey": "extraValue",
        "extraObject": {
          "someInt": 1
        }
      }
    }
  }
}
"""
    public static let actionMultiExpFlow: String = """
{
  "id": "counter-flow",
  "views": [],
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "ACTION_1",
      "ACTION_1": {
        "state_type": "ACTION",
        "exp": ["{{foo}}", "{{bar}}"],
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done",
        "param": {
          "someKey": "someValue"
        },
        "extraKey": "extraValue",
        "extraObject": {
          "someInt": 1
        }
      }
    }
  }
}
"""
  public static let MULTIPAGE: String = """
    {
      "id": "transition-between-pages",
      "views": [
        {
          "id": "view-1",
          "type": "action",
          "value": "next",
          "label": {
            "asset": {
              "id": "view-1-label",
              "type": "text",
              "value": "Go to View 2"
            }
          }
        },
        {
          "id": "view-2",
          "type": "action",
          "value": "prev",
          "label": {
            "asset": {
              "id": "view-2-label",
              "type": "text",
              "value": "Go to View 1"
            }
          }
        }
      ],
      "navigation": {
        "BEGIN": "FLOW_1",
        "FLOW_1": {
          "startState": "VIEW_1",
          "VIEW_1": {
            "ref": "view-1",
            "state_type": "VIEW",
            "transitions": {
              "next": "VIEW_2"
            }
          },
          "VIEW_2": {
            "ref": "view-2",
            "state_type": "VIEW",
            "transitions": {
              "prev": "VIEW_1"
            }
          }
        }
      }
    }

    """
}
