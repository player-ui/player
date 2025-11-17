//
//  FlowManagerView.swift
//  Pods
//
//  Created by Zhao Xia Wu on 2023-11-01.
//

import SwiftUI
import PlayerUI
import PlayerUISwiftUI
import PlayerUIReferenceAssets
import PlayerUIMetricsPlugin
import PlayerUIExternalActionViewModifierPlugin

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
                        plugins: [
                            ReferenceAssetsPlugin(),
                            MetricsPlugin { (render, _, flow) in
                                print("Render: \(render?.duration ?? 0 )ms | Request \(flow?.flow.requestTime ?? 0)ms")
                            },
                            ExternalActionViewModifierPlugin<ExternalStateSheetModifier> { (state, _, transition) in

                                return AnyView(
                                    Text("External State")
                                        .onDisappear {
                                            transition("Next")
                                        }
                                )
                            }
                        ],
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
        }
//        .navigationBarTitle(Text(navTitle))
        .navigationTitle(navTitle)
    }
}
