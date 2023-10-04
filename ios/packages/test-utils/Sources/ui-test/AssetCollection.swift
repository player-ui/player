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
public struct AssetCollection: View {
    let plugins: [NativePlugin]
    let sections: [FlowLoader.FlowSection]
    let padding: CGFloat
    let completion: ((Result<CompletedState, PlayerError>) -> Void)?

    /**
     Initializes and loads flows
     - parameters:
        - plugins: Plugins to add to Player instance that is created
        - sections: The `[FlowSection]` to display
        - completion: A handler for when a flow reaches an end state
     */
    public init(
        plugins: [NativePlugin],
        sections: [FlowLoader.FlowSection],
        padding: CGFloat = 16,
        completion: ((Result<CompletedState, PlayerError>) -> Void)? = nil
    ) {
        self.plugins = plugins
        self.padding = padding
        self.completion = completion
        self.sections = sections
    }

    public var body: some View {
        List {
            ForEach(sections, id: \.title) { section in
                Section {
                    ForEach(section.flows, id: \.name) { flow in
                        NavigationLink(flow.name) {
                            AssetFlowView(flow: flow.flow, plugins: plugins, completion: completion)
                                .padding(padding)
                                .navigationBarTitle(Text(flow.name))
                        }
                        .accessibility(identifier: "\(section.title) \(flow.name)")
                    }
                } header: {
                    Text(section.title)
                }

            }
        }
        .accessibility(identifier: "AssetCollection")
        .navigationBarTitle(Text("Flows"))
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
