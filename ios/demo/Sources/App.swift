import PlayerUI
import PlayerUIBaseBeaconPlugin
import PlayerUIBeaconPlugin
import PlayerUIExpressionPlugin
import PlayerUIExternalStatePlugin
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
        Binding(get: { result != nil }, set: { newValue in
            guard !newValue else { return }
            result = nil
        })
    }

    private var plugins: [NativePlugin] {
        [
            PrintLoggerPlugin(level: .trace),
            ReferenceAssetsPlugin(),
            ExpressionPlugin(),
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
            ExternalStatePlugin(handlers: [
                ExternalStateHandler(
                    ref: "test-1",
                    handlerFunction: { _, _, _ in
                        print("MainView External State triggered")
                    }
                ),
            ]),
        ]
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
            return error.error.message
        }
    }
}
