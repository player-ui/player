import PlayerUI
import PlayerUIA2UI
import PlayerUIExpressionPlugin
import PlayerUISwiftUI
import PlayerUITestUtilitiesCore
import SwiftUI

/// A self-contained demo screen that renders the full A2UI snapshot catalog
struct A2UIDemoView: View {
    private let plugins: [NativePlugin] = [
        A2UIPlugin(),
        ExpressionPlugin(),
    ]
    let sections: [FlowLoader.FlowSection]

    var body: some View {
        List {
            ForEach(sections, id: \.title) { section in
                Section {
                    ForEach(section.flows, id: \.name) { flow in
                        NavigationLink(flow.name) {
                            A2UIFlowView(snapshot: flow.flow, plugins: plugins)
                                .navigationTitle(flow.name)
                        }
                    }
                } header: {
                    Text(section.title)
                }
            }
        }
        .navigationTitle("A2UI")
    }
}

/// Renders one A2UI snapshot via `SwiftUIPlayer` with the A2UI start options.
private struct A2UIFlowView: View {
    let snapshot: String
    let plugins: [NativePlugin]
    @State private var result: Result<CompletedState, PlayerError>?

    var body: some View {
        ScrollView {
            SwiftUIPlayer(
                flow: snapshot,
                plugins: plugins,
                result: $result,
                context: .init(),
                startOptions: .a2ui
            )
            .padding()
        }
    }
}
