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

/**
 A SwiftUI View that contains two tabs AssetCollection and PluginsAndPlayer tab for ease of UITesting
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

    func assetFlowCompletion(result: Result<CompletedState, PlayerError>) {
        doneFlow = true
        switch result {
        case .success(let result):
            outcome = result.endState?.outcome ?? "No Outcome"
        case .failure(let error):
            guard case let .promiseRejected(errorState) = error else {
                outcome = error.localizedDescription
                return
            }

            outcome = errorState.error
        }
    }

    var flowsListSection: some View {
        return AssetCollection(
            plugins: plugins,
            sections: assetSections,
            padding: padding,
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
        return PluginsAndPlayerCollection(plugins: plugins, sections: pluginSections)
    }
}
