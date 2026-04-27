import PlayerUI
import PlayerUIBaseBeaconPlugin
import PlayerUIBeaconPlugin
import PlayerUICommonExpressionsPlugin
import PlayerUICommonTypesPlugin
import PlayerUIExpressionPlugin
import PlayerUIExternalActionPlugin
import PlayerUILogger
import PlayerUIMetricsPlugin
import PlayerUIPrintLoggerPlugin
import PlayerUIPubSubPlugin
import PlayerUIReferenceAssets
import PlayerUISwiftUI
import PlayerUISwiftUIPendingTransactionPlugin
import PlayerUITransitionPlugin
import PlayerUITypesProviderPlugin
import SwiftUI

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
    ]

    @State var result: Result<CompletedState, PlayerError>?

    var body: some View {
        SegmentControlView(
            plugins: plugins,
            assetSections: MockFlows.assetSections,
            pluginSections: MockFlows.pluginSections,
            result: $result
        )
        .navigationBarTitleDisplayMode(.inline)
        .alert(isPresented: showAlert, content: {
            Alert(
                title: Text("Flow Finished"),
                message: Text(result?.message ?? "No Result"),
                dismissButton: .default(Text("Done"))
            )
        })
    }

    var showAlert: Binding<Bool> {
        // swiftlint:disable:next multiple_closures_with_trailing_closure
        Binding(get: { result != nil }) { newValue in
            guard !newValue else { return }
            result = nil
        }
    }
}

extension Result where Success == CompletedState, Failure == PlayerError {
    var message: String {
        switch self {
        case let .success(success):
            return success.endState?.outcome ?? "No Outcome"
        case let .failure(failure):
            guard case let .promiseRejected(error) = failure else {
                return failure.playerDescription
            }
            return error.error
        }
    }
}
