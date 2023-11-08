//
//  SegmentControlView.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2023-11-08.
//

import Foundation
import SwiftUI
import Combine

/**
 A SwiftUI View to load flows for ease of UI testing
 */
public struct SegmentControlView: View {
    let plugins: [NativePlugin]
    let assetSections: [FlowLoader.FlowSection]
    let pluginSections: [FlowLoader.FlowSection]
    let padding: CGFloat
    /**
     Initializes and loads flows
     - parameters:
        - plugins: Plugins to add to Player instance that is created
        - assetSections: The `[FlowSection]` to display asset flows
        - pluginSections: The `[FlowSection]` to display plugin flows
        - padding: Padding around the AssetFlowView ``
     */
    public init(
        plugins: [NativePlugin],
        assetSections: [FlowLoader.FlowSection],
        pluginSections: [FlowLoader.FlowSection],
        padding: CGFloat = 16
    ) {
        self.plugins = plugins
        self.assetSections = assetSections
        self.pluginSections = pluginSections
        self.padding = padding
    }

    enum HeaderSelection: String, CaseIterable {
        case flows = "Asset Flows"
        case player = "Plugins + Managed Player"
    }

    @State var segmentationSelection: HeaderSelection = .flows

    @State var pubsubEventPublished = false
    @State var pubsubEventName = ""
    @State var pubsubEventMessage = ""

    @State var beaconsRecieved = false
    @State var beaconsInfo = ""

    @State var doneFlow = false
    @State var outcome = ""

    public var body: some View {
        VStack {
            Picker("", selection: $segmentationSelection) {
                ForEach(HeaderSelection.allCases, id: \.self) { option in
                    Text(option.rawValue)
                }
            }.pickerStyle(SegmentedPickerStyle())

            Spacer()

            if segmentationSelection == .flows {
                flowsListSection
            } else {
                playerListSection
            }
        }
    }

    func assetFlowCompletion(result: Result<CompletedState, PlayerError>) {
        doneFlow = true
        switch result {
        case .success(let result):
            outcome = result.endState?.outcome ?? "No Outcome"
        case .failure(let error):
            guard case let .promiseRejected(errorState) = error else {
                outcome = error.playerDescription
                return
            }

            outcome = errorState.error
        }
    }

    var flowsListSection: some View {
        return AssetCollection(
            plugins: plugins,
            sections: assetSections,
            completion: self.assetFlowCompletion(result:)
        )
        .accessibility(identifier: "AssetCollection")
        .navigationBarTitle(Text("Flows"))
        .alert(isPresented: $doneFlow, content: {
            Alert(title: Text("FlowFinished"),
                    message: Text("Outcome: \(outcome)"),
                    dismissButton: .default(Text("OK")))
        })
    }

    var playerListSection: some View {
        List {
            // Plugin flows
            ForEach(pluginSections, id: \.title) { section in
                Section {
                    ForEach(section.flows, id: \.name) { flow in
                        NavigationLink(flow.name) {
                            PlayerLoader(flow: flow.flow)
                                .navigationBarTitle(Text(flow.name))
                        }
                        .accessibility(identifier: "\(section.title) \(flow.name)")
                    }
                } header: {
                    Text(section.title)
                }
            }

            // Managed Player flows
            Section {
                NavigationLink("Simple Flows") {
                    FlowManagerView(flowSequence: [.firstFlow, .secondFlow], navTitle: "Simple Flows")
                }.accessibility(identifier: "Simple Flows")

                NavigationLink("Error Content Flow") {
                    FlowManagerView(flowSequence: [.firstFlow, .errorFlow], navTitle: "Error Content Flow")
                }.accessibility(identifier: "Error Content Flow")

                NavigationLink("Error Asset Flow") {
                    FlowManagerView(flowSequence: [.firstFlow, .assetErrorFlow], navTitle: "Error Asset Flow")
                }.accessibility(identifier: "Error Asset Flow")
            }  header: {
                Text("Managed Player")
            }
        }
        .accessibility(identifier: "Player")
        .navigationBarTitle(Text("Player"))
    }
}

private struct PlayerLoader: View {
    private let flow: String
    @StateObject private var loader: LoaderState
    @StateObject private var context: SwiftUIPlayer.Context

    @State var doneFlow = false
    @State var outcome: String = ""
    @State var errorMessage = ""
    @State var beaconInfo = ""
    @State var pubsubInfo = ""

    init(flow: String) {
        self.flow = flow
        let loader = LoaderState()
        let context = SwiftUIPlayer.Context()
        self._loader = StateObject(wrappedValue: loader)
        self._context = StateObject(wrappedValue: context)
    }

    final class LoaderState: ObservableObject {
        var beaconStructList: [DefaultBeacon] = []
        var pubsubInfo: [String] = []
        lazy var plugins: [NativePlugin] = .defaults(loader: self)
    }

    func completion(result: Result<CompletedState, PlayerError>) {
        doneFlow = true
        switch result {
        case .success(let result):
            outcome = result.endState?.outcome ?? "No Outcome"

            let combinedJSONArray: [String] = loader.beaconStructList.compactMap { beaconStruct in
                let encoder = JSONEncoder()
                if let data = try? encoder.encode(beaconStruct),
                   let jsonString = String(data: data, encoding: .utf8) {
                    return jsonString
                } else {
                    return nil
                }
            }

            beaconInfo = "[" + combinedJSONArray.joined(separator: ",\n") + "]"
            pubsubInfo = "[" + loader.pubsubInfo.joined(separator: ",\n") + "]"
        case .failure(let error):
            guard case let .promiseRejected(errorState) = error else {
                outcome = error.playerDescription
                return
            }

            outcome = errorState.error
        }
    }

    var body: some View {
        AssetFlowView(flow: flow, plugins: loader.plugins, completion: self.completion(result:))
            .alert(isPresented: $doneFlow, content: {
                Alert(title: Text("FlowFinished"),
                        message: Text("Outcome: \(outcome) \n\n Beacons Info: \(beaconInfo) \n\n Pubsub events: \(pubsubInfo)"),
                        dismissButton: .default(Text("OK")))
            }
        )
    }
}

public extension Array where Element == NativePlugin {
    static var defaults: [NativePlugin] {
        defaults(loader: nil)
    }

    fileprivate static func defaults(loader: PlayerLoader.LoaderState?) -> [NativePlugin] {
        [
            ReferenceAssetsPlugin(),
            ExternalActionPlugin(handler: { state, options, transition in
                guard state.ref == "test-1" else { return transition("Prev") }
                let transitionValue = options.data.get(binding: "transitionValue") as? String
                options.expression.evaluate("{{foo}} = 'bar'")
                transition(transitionValue ?? "Next")
            }),
            PubSubPlugin([("some-event", { [weak loader] (eventName, eventData) in
                loader?.pubsubInfo.append("Event Name: \(eventName), Event Data: \(String(describing: eventData))")
            })]),
            BeaconPlugin<DefaultBeacon> { [weak loader] beaconStruct in
                loader?.beaconStructList.append(beaconStruct)

            }
        ]
    }
}
