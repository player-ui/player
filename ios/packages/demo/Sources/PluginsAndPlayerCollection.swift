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

/**
 A SwiftUI View to load flows for Plugin and ManagedPlayer for ease of UITesting
 */
public struct PluginsAndPlayerCollection: View {
    let plugins: [NativePlugin]
    let sections: [FlowLoader.FlowSection]
    let padding: CGFloat
    let completion: ((Result<CompletedState, PlayerError>) -> Void)?

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
        padding: CGFloat = 16,
        completion: ((Result<CompletedState, PlayerError>) -> Void)? = nil
    ) {
        self.plugins = plugins
        self.padding = padding
        self.sections = sections
        self.completion = completion
    }

    @State var beaconAndPubsubInfo = ""
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
            }  header: {
                Text("Managed Player")
            }
        }
        .accessibility(identifier: "Player")
        .navigationBarTitle(Text("Player"))
    }

    var pluginFlows: some View {
        let pubsubPlugin = PubSubPlugin([("some-event", { (eventName, eventData) in
            $alertPresented.wrappedValue = true
            // $pubsubInfo.wrappedValue =
            switch eventData {
            case .string(data: let string):
                $beaconAndPubsubInfo.wrappedValue = $beaconAndPubsubInfo.wrappedValue + "Published: `\(eventName)` with message: `\(string)` \n"
            default: break
            }
        })])

        let beaconPlugin =  BeaconPlugin<DefaultBeacon> { beaconStruct in
            $alertPresented.wrappedValue = true
            let encoder = JSONEncoder()
            if let data = try? encoder.encode(beaconStruct), let jsonString = String(data: data, encoding: .utf8) {
                $beaconAndPubsubInfo.wrappedValue = $beaconAndPubsubInfo.wrappedValue  + "Beacon: \(jsonString) \n"
            }
        }

        let external =  ExternalActionPlugin(handler: { state, options, transition in
            guard state.ref == "test-1" else { return transition("Prev") }
            let transitionValue = options.data.get(binding: "transitionValue") as? String
            options.expression.evaluate("{{foo}} = 'bar'")
            transition(transitionValue ?? "Next")
        })

          return  ForEach(sections, id: \.title) { section in
                Section {
                    ForEach(section.flows, id: \.name) { flow in
                        NavigationLink(flow.name) {
                            AssetFlowView(flow: flow.flow, plugins: [external] + plugins + [beaconPlugin, pubsubPlugin], completion: completion)
                                .padding(padding)
                                .navigationBarTitle(Text(flow.name))
                                .modifier(AlertViewModifier(alertPresented: $alertPresented, pubsubEventName: $beaconAndPubsubInfo))
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

        func body(content: Content) -> some View {
            content
                .alert(
                    isPresented: $alertPresented,
                    content: { Alert(title: Text("Info"), message: Text("Data: \n \($pubsubEventName.wrappedValue)"),
                        dismissButton: .default(Text("OK")))
                            }
                )
        }
    }
}
