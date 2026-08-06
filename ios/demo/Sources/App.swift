import Combine
import Foundation
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
import PlayerUITestUtilitiesCore
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

/// A SwiftUI View that contains different tabs for ease of UITesting (Assets, Plugins, A2UI)
struct MainView: View {
    private let mocks: Mocks = .init()

    @State private var result: Result<CompletedState, PlayerError>?
    @State private var segmentationSelection: HeaderSelection = .assets

    var body: some View {
        VStack {
            Picker("", selection: $segmentationSelection) {
                ForEach(HeaderSelection.allCases, id: \.self) { option in
                    Text(option.rawValue)
                }
            }.pickerStyle(SegmentedPickerStyle())

            Spacer()

            switch segmentationSelection {
            case .assets:
                assetDemos
            case .plugins:
                PluginsAndPlayerCollection(plugins: .defaults, sections: mocks.pluginsSections)
            case .a2ui:
                A2UIDemoView(sections: mocks.a2uiSections)
            }
        }
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

    var assetDemos: some View {
        AssetCollection(
            plugins: .defaults,
            sections: mocks.assetSections,
            result: $result
        )
        .accessibility(identifier: "AssetCollection")
        .navigationBarTitle(Text("Flows"))
    }

    enum HeaderSelection: String, CaseIterable {
        case assets = "Asset Demos"
        case plugins = "Plugin Demos"
        case a2ui = "A2UI Asset Demos"
    }
}

extension [NativePlugin] {
    static let defaults: [NativePlugin] = [
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
