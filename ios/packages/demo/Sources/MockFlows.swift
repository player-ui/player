// swiftlint:disable all
import PlayerUI

public struct MockFlows {
    static let actionCounter: String = """
{
  "id": "generated-flow",
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
static let actionTransitionToEnd: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "collection",
      "type": "collection",
      "values": [
        {
          "asset": {
            "id": "action-good",
            "type": "action",
            "value": "Next",
            "label": {
              "asset": {
                "id": "action-good-label",
                "type": "text",
                "value": "End the flow (success)"
              }
            }
          }
        },
        {
          "asset": {
            "id": "action-bad",
            "type": "action",
            "exp": "{{foo.bar..}",
            "label": {
              "asset": {
                "id": "action-bad-label",
                "type": "text",
                "value": "End the flow (error)"
              }
            }
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "collection",
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
static let actionBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "action",
      "type": "action",
      "exp": "{{count}} = {{count}} + 1",
      "label": {
        "asset": {
          "id": "action-label",
          "type": "text",
          "value": "Count: {{count}}"
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
static let actionNavigation: String = """
{
  "id": "action-navigation-flow",
  "views": [
    {
      "id": "view-1",
      "type": "collection",
      "label": {
        "asset": {
          "id": "title",
          "type": "text",
          "value": "View 1"
        }
      },
      "values": [
        {
          "asset": {
            "id": "action-prev",
            "type": "action",
            "value": "Prev",
            "label": {
              "asset": {
                "id": "action-prev-id",
                "type": "text",
                "value": "Go Back Without Icon"
              }
            },
            "metaData": {
              "role": ""
            }
          }
        },
        {
          "asset": {
            "id": "action-prev-without-icon",
            "type": "action",
            "value": "Prev",
            "label": {
              "asset": {
                "id": "action-prev-id-without-icon",
                "type": "text",
                "value": "Go Back With Role"
              }
            },
            "metaData": {
              "role": "back"
            }
          }
        },
        {
          "asset": {
            "id": "action-next",
            "type": "action",
            "value": "Next",
            "label": {
              "asset": {
                "id": "action-next-id",
                "type": "text",
                "value": "Next"
              }
            }
          }
        }
      ]
    },
    {
      "id": "view-2",
      "type": "collection",
      "label": {
        "asset": {
          "id": "title",
          "type": "text",
          "value": "View 2"
        }
      },
      "values": [
        {
          "asset": {
            "id": "action-prev",
            "type": "action",
            "value": "Prev",
            "label": {
              "asset": {
                "id": "action-prev-id",
                "type": "text",
                "value": "Go Back"
              }
            }
          }
        },
        {
          "asset": {
            "id": "action-next",
            "type": "action",
            "value": "Next",
            "label": {
              "asset": {
                "id": "action-next-id",
                "type": "text",
                "value": "End"
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
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "view-1",
        "transitions": {
          "Next": "VIEW_2",
          "Prev": "END"
        }
      },
      "VIEW_2": {
        "state_type": "VIEW",
        "ref": "view-2",
        "transitions": {
          "Next": "END",
          "Prev": "VIEW_1"
        }
      },
      "END": {
        "state_type": "END",
        "outcome": "done"
      }
    }
  },
  "data": {}
}
"""
static let collectionBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "view-1",
      "type": "collection",
      "label": {
        "asset": {
          "id": "title",
          "type": "text",
          "value": "Collections are used to group assets."
        }
      },
      "values": [
        {
          "asset": {
            "id": "text-1",
            "type": "text",
            "value": "This is the first item in the collection"
          }
        },
        {
          "asset": {
            "id": "text-2",
            "type": "text",
            "value": "This is the second item in the collection"
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "view-1",
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
static let imageBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "image-1",
      "type": "image",
      "metaData": {
        "ref": "https://player-ui.github.io/latest/logo/logo-light-large.png"
      }
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "image-1",
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
static let imageWithAccessibility: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "image-1",
      "type": "image",
      "metaData": {
        "ref": "https://player-ui.github.io/latest/logo/logo-light-large.png",
        "accessibility": "This is accessibility text for an image"
      },
      "placeholder": "This is placeholder text for an image"
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "image-1",
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
static let imageWithCaption: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "image-1",
      "type": "image",
      "metaData": {
        "ref": "https://player-ui.github.io/latest/logo/logo-light-large.png"
      },
      "caption": {
        "asset": {
          "id": "image-caption",
          "type": "text",
          "value": "Image caption"
        }
      }
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "image-1",
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
static let imageWithPlaceholder: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "image-1",
      "type": "image",
      "metaData": {
        "ref": "https://player-ui.github.io/latest/logo/logo-light-large.png"
      },
      "placeholder": "This is placeholder text for an image"
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "image-1",
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
static let infoFooter: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "info-view",
      "type": "info",
      "title": {
        "asset": {
          "id": "info-title",
          "type": "text",
          "value": "View Title"
        }
      },
      "actions": [
        {
          "asset": {
            "id": "next-action",
            "value": "Next",
            "type": "action",
            "label": {
              "asset": {
                "id": "next-action-label",
                "type": "text",
                "value": "Continue"
              }
            }
          }
        }
      ],
      "footer": {
        "asset": {
          "id": "info-footer",
          "type": "text",
          "value": "Footer text"
        }
      }
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "info-view",
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
static let infoDynamicFlow: String = """
{
  "id": "modal-flow",
  "views": [
    {
      "id": "view-1",
      "type": "info",
      "title": {
        "asset": {
          "id": "view-title",
          "type": "text",
          "value": "View 1"
        }
      },
      "actions": [
        {
          "asset": {
            "id": "action-1",
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
        }
      ]
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
            "id": "action-1",
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
            "id": "action-2",
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
            "id": "action-3",
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
    },
    {
      "id": "view-4",
      "type": "info",
      "title": {
        "asset": {
          "id": "view-4-title",
          "type": "text",
          "value": "View 4"
        }
      },
      "actions": [
        {
          "asset": {
            "id": "action-4",
            "type": "action",
            "value": "Next",
            "label": {
              "asset": {
                "id": "action-4-label",
                "type": "text",
                "value": "Next"
              }
            }
          }
        }
      ]
    }
  ],
  "data": {
    "viewRef": "VIEW_3"
  },
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
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
          "stacked": true
        },
        "transitions": {
          "Next": "{{viewRef}}",
          "Dismiss": "VIEW_1"
        }
      },
      "VIEW_3": {
        "state_type": "VIEW",
        "ref": "view-3",
        "transitions": {
          "*": "VIEW_1"
        }
      },
      "VIEW_4": {
        "state_type": "VIEW",
        "ref": "view-4",
        "transitions": {
          "*": "VIEW_1"
        }
      }
    }
  }
}
"""
static let infoBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "info-view",
      "type": "info",
      "title": {
        "asset": {
          "id": "info-title",
          "type": "text",
          "value": "View Title"
        }
      },
      "actions": [
        {
          "asset": {
            "id": "next-action",
            "value": "Next",
            "type": "action",
            "label": {
              "asset": {
                "id": "next-action-label",
                "type": "text",
                "value": "Continue"
              }
            }
          }
        },
        {
          "asset": {
            "id": "prev-action",
            "value": "Prev",
            "type": "action",
            "label": {
              "asset": {
                "id": "next-action-label",
                "type": "text",
                "value": "Back"
              }
            }
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "info-view",
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
static let infoModalFlow: String = """
{
  "id": "modal-flow",
  "views": [
    {
      "id": "view-1",
      "type": "info",
      "title": {
        "asset": {
          "id": "view-title",
          "type": "text",
          "value": "View 1"
        }
      },
      "actions": [
        {
          "asset": {
            "id": "action-1",
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
        }
      ]
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
            "id": "action-1",
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
            "id": "action-2",
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
            "id": "action-3",
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
      "startState": "VIEW_1",
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
          "stacked": true
        },
        "transitions": {
          "Next": "VIEW_3",
          "Dismiss": "VIEW_1"
        }
      },
      "VIEW_3": {
        "state_type": "VIEW",
        "ref": "view-3",
        "transitions": {
          "*": "VIEW_1"
        }
      }
    }
  }
}
"""
static let inputTransition: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "input-validation",
      "type": "info",
      "title": {
        "asset": {
          "id": "title",
          "type": "text",
          "value": "Some validations can prevent users from advancing"
        }
      },
      "primaryInfo": {
        "asset": {
          "id": "primaryInfo",
          "type": "collection",
          "values": [
            {
              "asset": {
                "id": "input-1",
                "type": "input",
                "label": {
                  "asset": {
                    "id": "input-1-label",
                    "type": "text",
                    "value": "Input with validation and formatting"
                  }
                },
                "note": {
                  "asset": {
                    "id": "input-1-note",
                    "type": "text",
                    "value": "It expects a positive integer"
                  }
                },
                "binding": "foo.bar"
              }
            }
          ]
        }
      },
      "actions": [
        {
          "asset": {
            "id": "next-action",
            "value": "Next",
            "type": "action",
            "label": {
              "asset": {
                "id": "next-action-label",
                "type": "text",
                "value": "Continue"
              }
            }
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "input-validation",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done"
      }
    }
  },
  "schema": {
    "ROOT": {
      "foo": {
        "type": "FooType"
      }
    },
    "FooType": {
      "bar": {
        "type": "IntegerPosType",
        "validation": [
          {
            "type": "required"
          }
        ]
      }
    }
  }
}
"""
static let inputBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "input",
      "type": "input",
      "binding": "foo.bar",
      "label": {
        "asset": {
          "id": "input-label",
          "type": "text",
          "value": "This is an input"
        }
      },
      "note": {
        "asset": {
          "id": "input-note",
          "type": "text",
          "value": "This is a note"
        }
      }
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "input",
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
static let inputValidation: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "input-1",
      "type": "input",
      "label": {
        "asset": {
          "id": "input-1-label",
          "type": "text",
          "value": "Input with validation and formatting"
        }
      },
      "note": {
        "asset": {
          "id": "input-1-note",
          "type": "text",
          "value": "It expects a positive integer"
        }
      },
      "binding": "foo.bar"
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "input-1",
        "transitions": {
          "*": "END_Done"
        }
      },
      "END_Done": {
        "state_type": "END",
        "outcome": "done"
      }
    }
  },
  "schema": {
    "ROOT": {
      "foo": {
        "type": "FooType"
      }
    },
    "FooType": {
      "bar": {
        "type": "IntegerPosType",
        "validation": [
          {
            "type": "required"
          }
        ]
      }
    }
  }
}
"""
static let textBasic: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "view-1",
      "type": "collection",
      "values": [
        {
          "asset": {
            "id": "text-1",
            "type": "text",
            "value": "This is some text."
          }
        },
        {
          "asset": {
            "id": "text-2",
            "type": "text",
            "value": "This is some text that is a link",
            "modifiers": [
              {
                "type": "link",
                "metaData": {
                  "ref": "https://intuit.com"
                }
              }
            ]
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "view-1",
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
static let textWithLink: String = """
{
  "id": "generated-flow",
  "views": [
    {
      "id": "text",
      "type": "text",
      "value": "A Link",
      "modifiers": [
        {
          "type": "link",
          "metaData": {
            "mime-type": "text/html",
            "ref": "http://www.intuit.com"
          }
        }
      ]
    }
  ],
  "data": {},
  "navigation": {
    "BEGIN": "FLOW_1",
    "FLOW_1": {
      "startState": "VIEW_1",
      "VIEW_1": {
        "state_type": "VIEW",
        "ref": "text",
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
    public static let sections: [FlowLoader.FlowSection] = [
        (title: "action", flows: [
            (name: "counter", flow: MockFlows.actionCounter),
            (name: "transition to end", flow: MockFlows.actionTransitionToEnd),
            (name: "basic", flow: MockFlows.actionBasic),
            (name: "navigation", flow: MockFlows.actionNavigation)
        ]),
        (title: "collection", flows: [
            (name: "basic", flow: MockFlows.collectionBasic)
        ]),
        (title: "image", flows: [
            (name: "basic", flow: MockFlows.imageBasic),
            (name: "with accessibility", flow: MockFlows.imageWithAccessibility),
            (name: "with caption", flow: MockFlows.imageWithCaption),
            (name: "with placeholder", flow: MockFlows.imageWithPlaceholder)
        ]),
        (title: "info", flows: [
            (name: "footer", flow: MockFlows.infoFooter),
            (name: "dynamic flow", flow: MockFlows.infoDynamicFlow),
            (name: "basic", flow: MockFlows.infoBasic),
            (name: "modal flow", flow: MockFlows.infoModalFlow)
        ]),
        (title: "input", flows: [
            (name: "transition", flow: MockFlows.inputTransition),
            (name: "basic", flow: MockFlows.inputBasic),
            (name: "validation", flow: MockFlows.inputValidation)
        ]),
        (title: "text", flows: [
            (name: "basic", flow: MockFlows.textBasic),
            (name: "with link", flow: MockFlows.textWithLink)
        ])
    ]
}
