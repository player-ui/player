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
import PlayerUIReproPlugin

@main
struct BazelApp: App {
    var body: some Scene {
        WindowGroup {
            NavigationView {
                MainView()
            }
        }
    }
}

struct MainView: View {
    @State var result: Result<CompletedState, PlayerError>? = nil

    var showAlert: Binding<Bool> {
        Binding(get: { result != nil }) { newValue in
            guard !newValue else { return }
            result = nil
        }
    }

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
        SwiftUIPendingTransactionPlugin<PendingTransactionPhases>(),
        ReproPlugin()
    ]
    var body: some View {
        SegmentControlView(
            plugins: plugins,
            assetSections: MockFlows.assetSections,
            pluginSections: MockFlows.pluginSections,
            result: $result
        )
        .navigationBarTitleDisplayMode(.inline)
        .alert(isPresented: showAlert, content: {
            return Alert(
                title: Text("Flow Finished"),
                message: Text(result?.message ?? "No Result"),
                dismissButton: .default(Text("Done"))
            )
        })
    }
}

extension Result where Success == CompletedState, Failure == PlayerError {
    var message: String {
        switch self {
        case .success(let success):
            return success.endState?.outcome ?? "No Outcome"
        case .failure(let failure):
            guard case let .promiseRejected(error) = failure else {
                return failure.playerDescription
            }
            return error.error
        }
    }
}
