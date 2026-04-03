//
//  FlowManagerView.swift
//
//  Created by Zhao Xia Wu on 2023-11-01.
//

import SwiftUI
import PlayerUI
import PlayerUISwiftUI
import PlayerUIReferenceAssets
import PlayerUIMetricsPlugin
import PlayerUIExternalStateViewModifierPlugin

/**
 SwiftUI View to wrap the `ManagedPlayer` and handle the result
 for use in UI testing
 */
public struct FlowManagerView: View {
    let flowSequence: [String]
    let navTitle: String
    @State private var complete = false

    public var body: some View {
        VStack {
            if complete {
                VStack {
                    Text("Flow Completed").font(.title)
                    Button(action: {complete = false}, label: { Text("Start Over " )})
                }
            } else {
                VStack {
                    ManagedPlayer(
                        plugins: plugins,
                        flowManager: ConstantFlowManager(flowSequence),
                        onComplete: { _ in
                            complete = true
                        },
                        fallback: { (context) in
                            VStack {
                                Text(context.error.localizedDescription)

                                switch context.error as? PlayerError {
                                case .promiseRejected(error: let errorState) :
                                    Text(errorState.error)
                                default:
                                    EmptyView()
                                }

                                Button(action: context.retry, label: {
                                    Text("Retry")
                                })
                                Button(action: context.reset, label: {
                                    Text("Reset")
                                })
                            }.accessibility(identifier: "FallbackView")
                        },
                        loading: {
                            Text("Loading Flow")
                        }
                    )

                    Button(action: { complete = true }) {
                        Text("Terminate Flow")
                    }
                }
            }
        }.navigationBarTitle(Text(navTitle))
    }

    private var plugins: [NativePlugin] {
        [
            ReferenceAssetsPlugin(),
            MetricsPlugin { (render, _, flow) in
                print("Render: \(render?.duration ?? 0 )ms | Request \(flow?.flow.requestTime ?? 0)ms")
            }
        ] + throwingPlugins
    }

    private var throwingPlugins: [NativePlugin] {
        var plugins: [NativePlugin] = []
        do {
            let externalStatePlugin = try ExternalStateViewModifierPlugin<ExternalStateSheetModifier>(handlers: [
                .init(
                    match: ["ref": "test-1"],
                    handler: { _, _, transition in
                        return AnyView(
                            Text("External State")
                                .onAppear {
                                    print("Managed Player External State triggered")
                                }
                                .onDisappear {
                                    transition("Next")
                                }
                        )
                    }
                )
            ])
            plugins.append(externalStatePlugin)
        } catch {
            fatalError("Failed to create ExternalStatePlugin: \(error)")
        }
        return plugins
    }
}
