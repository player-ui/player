//
//  SegmentControlView.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2023-11-08.
//

import Foundation
import SwiftUI
import Combine
import PlayerUI
import PlayerUITestUtilitiesCore

/**
 A SwiftUI View that contains two tabs AssetCollection and PluginsAndPlayer tab for ease of UITesting
 */
public struct SegmentControlView: View {
    let plugins: [NativePlugin]
    let assetSections: [FlowLoader.FlowSection]
    let pluginSections: [FlowLoader.FlowSection]
    let padding: CGFloat
    let completion: ((Result<CompletedState, PlayerError>) -> Void)?
    /**
     Initializes and loads flows
     - parameters:
        - plugins: Plugins to add to Player instance that is created
        - assetSections: The `[FlowSection]` to display asset flows
        - pluginSections: The `[FlowSection]` to display plugin flows
        - padding: Padding around the AssetFlowView ``
        - completion: A handler for when a flow reaches an end state
     */
    public init(
        plugins: [NativePlugin],
        assetSections: [FlowLoader.FlowSection],
        pluginSections: [FlowLoader.FlowSection],
        padding: CGFloat = 16,
        completion: ((Result<CompletedState, PlayerError>) -> Void)? = nil
    ) {
        self.plugins = plugins
        self.assetSections = assetSections
        self.pluginSections = pluginSections
        self.padding = padding
        self.completion = completion
    }

    enum HeaderSelection: String, CaseIterable {
        case flows = "Asset Flows"
        case pluginsAndPlayer = "Plugins + Managed Player"
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

    var flowsListSection: some View {
        return AssetCollection(
            plugins: plugins,
            sections: assetSections,
            padding: padding,
            completion: completion
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
        return PluginsAndPlayerCollection(plugins: plugins, sections: pluginSections)
    }
}
