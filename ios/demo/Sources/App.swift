import SwiftUI
import PlayerUI
import PlayerUILogger
import PlayerUISwiftUI
import PlayerUIReferenceAssets

import PlayerUIBaseBeaconPlugin
import PlayerUIBeaconPlugin
import PlayerUICommonExpressionsPlugin
import PlayerUICommonTypesPlugin
import PlayerUIExpressionPlugin
import PlayerUIExternalActionPlugin
import PlayerUIMetricsPlugin
import PlayerUIPrintLoggerPlugin
import PlayerUIPubSubPlugin
import PlayerUISwiftUIPendingTransactionPlugin
import PlayerUITransitionPlugin
import PlayerUITypesProviderPlugin

let flow = """
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

@main
struct BazelApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                PlayerView()
            }
        }
    }
}

struct PlayerView: View {
    let plugins: [NativePlugin] = [
        PrintLoggerPlugin(level: .trace),
        ReferenceAssetsPlugin(),
        CommonTypesPlugin(),
        ExpressionPlugin(),
        CommonExpressionsPlugin(),
        ExternalActionPlugin(handler: { _, _, _ in
            print("external state")
        }),
        MetricsPlugin { timing, render, flow in
            print(timing as Any)
            print(render as Any)
            print(flow as Any)
        },
        RequestTimePlugin { 5 },
        PubSubPlugin([]),
        TypesProviderPlugin(types: [], validators: [], formats: []),
        TransitionPlugin(popTransition: .pop),
        BeaconPlugin<DefaultBeacon> { print(String(describing: $0)) },
        SwiftUIPendingTransactionPlugin<PendingTransactionPhases>()
    ]
    var body: some View {
        VStack {
            SwiftUIPlayer(flow: flow, plugins: plugins, result: .constant(nil))
        }
    }
}
