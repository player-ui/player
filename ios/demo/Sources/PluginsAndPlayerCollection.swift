//
//  PluginsAndPlayerCollection.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2023-11-09.
//

import Foundation
import SwiftUI
import Combine
import PlayerUI
import PlayerUITestUtilitiesCore
import PlayerUIBaseBeaconPlugin
import PlayerUIBeaconPlugin
import PlayerUIExternalActionPlugin
import PlayerUIPubSubPlugin

/**
 A SwiftUI View to load flows for Plugin and ManagedPlayer for ease of UITesting
 */
public struct PluginsAndPlayerCollection: View {
    let plugins: [NativePlugin]
    let sections: [FlowLoader.FlowSection]
    let padding: CGFloat

    /**
     Initializes and loads flows
     - parameters:
        - plugins: Plugins to add to Player instance that is created
        - sections: The `[FlowSection]` to display
        - padding: Padding around the AssetFlowView
     */
    public init(
        plugins: [NativePlugin],
        sections: [FlowLoader.FlowSection],
        padding: CGFloat = 16
    ) {
        self.plugins = plugins
        self.padding = padding
        self.sections = sections
    }

    @State var beaconAndPubsubInfo = ""
    @State var completionMessage = ""
    @State var alertPresented = false

    public var body: some View {

        List {
            // Plugin flows
            pluginFlows

            // Managed Player flows
            Section {
                NavigationLink("Simple Flows") {
                    FlowManagerView(flowSequence: [.firstFlow, .secondFlow], navTitle: "Simple Flows")
                        .padding(padding)
                }.accessibility(identifier: "Simple Flows")
                NavigationLink("Error Content Flow") {
                    FlowManagerView(flowSequence: [.firstFlow, .errorFlow], navTitle: "Error Content Flow")
                        .padding(padding)
                }.accessibility(identifier: "Error Content Flow")
                NavigationLink("Error Asset Flow") {
                    FlowManagerView(flowSequence: [.firstFlow, .assetErrorFlow], navTitle: "Error Asset Flow")
                        .padding(padding)
                }.accessibility(identifier: "Error Asset Flow")

                NavigationLink("Multi Action state before multi view flow") {
                    FlowManagerView(flowSequence: [.firstFlowAction, .secondFlowAction,  .multiViewTransitionFlow, .secondFlow], navTitle: "Multi Action state before multi view flow")
                        .padding(padding)
                }.accessibility(identifier: "Multi Action state before multi view flow")

                NavigationLink("External Action transition flow") {
                    FlowManagerView(flowSequence: [.externalActionFlow, .secondFlow], navTitle: "External Action transition flow")
                        .padding(padding)
                }.accessibility(identifier: "External Action transition flow")
            }  header: {
                Text("Managed Player")
            }
        }
        .accessibility(identifier: "Player")
        .navigationTitle("Player")
//        .navigationBarTitle(Text("Player"))
    }

    var pluginFlows: some View {
        let pubsubPlugin = PubSubPlugin([("some-event", { (eventName, eventData) in
            $alertPresented.wrappedValue = true

            switch eventData {
            case .string(data: let string):
                $beaconAndPubsubInfo.wrappedValue += "Published: `\(eventName)` with message: `\(string)` \n"
            default: break
            }
        })])

        let beaconPlugin =  BeaconPlugin<DefaultBeacon> { beaconStruct in
            $alertPresented.wrappedValue = true
            let encoder = JSONEncoder()
            if let data = try? encoder.encode(beaconStruct), let jsonString = String(data: data, encoding: .utf8) {
                $beaconAndPubsubInfo.wrappedValue += "Beacon: \(jsonString) \n"
            }
        }

        let externalActionPlugin =  ExternalActionPlugin(handler: { state, options, transition in
            guard state.ref == "test-1" else { return transition("Prev") }
            let transitionValue = options.data.get(binding: "transitionValue") as? String
            options.expression.evaluate("{{foo}} = 'bar'")
            transition(transitionValue ?? "Next")
        })

        return ForEach(sections, id: \.title) { section in
            Section {
                ForEach(section.flows, id: \.name) { flow in
                    NavigationLink(flow.name) {
                        AssetFlowView(flow: flow.flow, plugins: plugins + [externalActionPlugin, beaconPlugin, pubsubPlugin], completion: completion(result:))
                            .padding(padding)
                            .navigationTitle(flow.name)
//                            .navigationBarTitle(Text(flow.name))
                            .modifier(
                                AlertViewModifier(
                                    alertPresented: $alertPresented,
                                    pubsubEventName: $beaconAndPubsubInfo,
                                    completionMessage: $completionMessage)
                            )
                            .onDisappear {
                                // clear tracked beacons and pub sub info
                                $beaconAndPubsubInfo.wrappedValue = ""
                            }
                    }
                    .accessibility(identifier: "\(section.title) \(flow.name)")
                }
            } header: {
                Text(section.title)
            }
        }
    }

    struct AlertViewModifier: ViewModifier {
        @Binding var alertPresented: Bool
        @Binding var pubsubEventName: String
        @Binding var completionMessage: String

        func body(content: Content) -> some View {
            content
                .alert(
                    isPresented: $alertPresented,
                    content: {
                        Alert(
                            title: (completionMessage != "" ? Text("FlowCompleted") : Text("Info")),
                            message: Text("Data: \n \($pubsubEventName.wrappedValue) \n Completion: \($completionMessage.wrappedValue)"),
                            dismissButton: .default(Text("OK"))
                        )
                    }
                )
        }
    }

    func completion(result: Result<CompletedState, PlayerError>) {
        $alertPresented.wrappedValue = true
        switch result {
        case .success(let result):
            completionMessage = result.endState?.outcome ?? "No Outcome"
        case .failure(let error):
            guard case let .promiseRejected(errorState) = error else {
                completionMessage = "\(error)"
                return
            }

            completionMessage = "\(errorState.error)"
        }
    }
}
