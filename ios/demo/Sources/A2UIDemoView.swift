import SwiftUI
import PlayerUI
import PlayerUISwiftUI
import PlayerUIA2UI
import PlayerUIExpressionPlugin
import PlayerUICommonExpressionsPlugin

/// A single named A2UI snapshot to exercise in the demo.
private struct A2UIMock: Identifiable {
    let name: String
    let snapshot: String
    var id: String { name }
}

/// A self-contained demo screen that renders the full canonical A2UI snapshot
/// catalog (`A2UIMockFlows.all`) through the `A2UIPlugin`, starting each flow with
/// `StartOptions.a2ui`.
struct A2UIDemoView: View {
    private let plugins: [NativePlugin] = [
        A2UIPlugin(),
        ExpressionPlugin(),
        CommonExpressionsPlugin()
    ]

    private let mocks: [A2UIMock] = A2UIMockFlows.all.map {
        A2UIMock(name: $0.name, snapshot: $0.snapshot)
    }

    var body: some View {
        List(mocks) { mock in
            NavigationLink(mock.name) {
                A2UIFlowView(snapshot: mock.snapshot, plugins: plugins)
                    .navigationTitle(mock.name)
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
