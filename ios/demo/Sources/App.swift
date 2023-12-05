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
        NavigationView {
            SegmentControlView(
                plugins: plugins,
                assetSections: MockFlows.assetSections,
                pluginSections: MockFlows.pluginSections,
                completion: { _ in
                  print("finished")
                }
            )
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
