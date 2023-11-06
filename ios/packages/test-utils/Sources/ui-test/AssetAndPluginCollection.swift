//
//  AssetCollectionViewController.swift
//  PlayerUI
//
//  Created by Harris Borawski on 2/18/21.
//

import Foundation
import SwiftUI
import Combine

/**
 A SwiftUI View to load flows for ease of UI testing
 */
public struct AssetAndPluginCollection: View {
    let sections: [FlowLoader.FlowSection]
    let padding: CGFloat

    /**
     Initializes and loads flows
     - parameters:
        - plugins: Plugins to add to Player instance that is created
        - sections: The `[FlowSection]` to display
        - completion: A handler for when a flow reaches an end state
     */
    public init(
        sections: [FlowLoader.FlowSection],
        padding: CGFloat = 16
    ) {
        self.padding = padding
        self.sections = sections
    }

    enum HeaderSelection: String, CaseIterable {
        case flows = "Flows"
        case player = "Player"
    }

    @State var segmentationSelection: HeaderSelection = .flows

    @State var pubsubEventPublished = false
    @State var pubsubEventName = ""
    @State var pubsubEventMessage = ""

    @State var beaconsRecieved = false
    @State var beaconsInfo = ""

    @State var doneFlow = false

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
        return List {
            ForEach(sections, id: \.title) { section in
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
        }
        .accessibility(identifier: "AssetAndPluginCollection")
        .navigationBarTitle(Text("Flows"))
    }

    var playerListSection: some View {
        List {
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

/**
 Helper for loading player flows
 */
public struct FlowLoader {
    /// A single flow to render as a `UITableViewCell`
    public typealias Flow = (name: String, flow: String)
    /// A section of flows, the title being the asset type
    public typealias FlowSection = (title: String, flows: [Flow])

    /**
     Loads a tree of Player Flows from the root of a given directory
     The provided path should be to a folder containing folders listed by asset type,
     Example:
     ```
     root
        - action
            - action-with-expression.json
        - text
            - text-basic.json
            - modifiers
                - text-with-modifiers.json
     ```
     - parameters:
        - path: The path in the bundle to the root directory
     - returns: An array of FlowSections for display
     */
    public static func loadTree(at path: String) -> [FlowSection] {
        let fileManager = FileManager.default
        let folders = (try? fileManager.contentsOfDirectory(atPath: path).sorted()) ?? []
        func loadFlows(_ folder: String) -> [Flow] {
            let subdirectory = "\(path)/\(folder)"
            let files = (try? fileManager.contentsOfDirectory(atPath: subdirectory)) ?? []
            return files
            .map { (name) -> [Flow] in
                var isDir: ObjCBool = false
                _ = fileManager.fileExists(atPath: "\(subdirectory)/\(name)", isDirectory: &isDir)
                if !isDir.boolValue {
                    let data = fileManager.contents(atPath: "\(subdirectory)/\(name)")
                    let json = String(data: data!, encoding: .utf8)!
                    return [(
                        name: name.lowercased().replacingOccurrences(of: ".json", with: ""),
                        flow: json
                    )]
                }
                return loadFlows("\(folder)/\(name)")
            }
            .reduce([]) { (accumulated, current) -> [Flow] in
                return accumulated + current
            }
        }
        return folders.map { folder in
            (title: folder, flows: loadFlows(folder).map { flow in
                (
                    // Remove the section name from the beginning of the name, and remove dashes
                    name: flow.name
                        .replacingOccurrences(of: "\(folder.lowercased())-", with: "")
                        .replacingOccurrences(of: "-", with: " "),
                    flow: flow.flow
                )
            })
        }
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
            PrintLoggerPlugin(level: .trace),
            ReferenceAssetsPlugin(),
            CommonTypesPlugin(),
            ExpressionPlugin(),
            CommonExpressionsPlugin(),
            ExternalActionPlugin(handler: { state, options, transition in
                guard state.ref == "test-1" else { return transition("Prev") }
                let transitionValue = options.data.get(binding: "transitionValue") as? String
                options.expression.evaluate("{{foo}} = 'bar'")
                transition(transitionValue ?? "Next")
            }),
            MetricsPlugin { timing, render, flow in
                print(timing as Any)
                print(render as Any)
                print(flow as Any)
            },
            RequestTimePlugin { 5 },
            PubSubPlugin([("some-event", { [weak loader] (eventName, eventData) in
                loader?.pubsubInfo.append("Event Name: \(eventName), Event Data: \(String(describing: eventData)) \n")
            })]),
            TypesProviderPlugin(types: [], validators: [], formats: []),
            TransitionPlugin(popTransition: .pop),
            BeaconPlugin<DefaultBeacon> { [weak loader] beaconStruct in
                loader?.beaconStructList.append(beaconStruct)

            }
        ]
    }
}
