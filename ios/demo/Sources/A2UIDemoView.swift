import SwiftUI
import PlayerUI
import PlayerUISwiftUI
import PlayerUIA2UI
import PlayerUICommonTypesPlugin
import PlayerUIExpressionPlugin
import PlayerUICommonExpressionsPlugin

/// A single named A2UI snapshot to exercise in the demo.
private struct A2UIMock: Identifiable {
    let name: String
    let snapshot: String
    var id: String { name }
}

/// A self-contained demo screen that renders raw A2UI snapshots through the
/// `A2UIPlugin`, starting each flow with `StartOptions.a2ui`.
struct A2UIDemoView: View {
    private let plugins: [NativePlugin] = [
        A2UIPlugin(),
        CommonTypesPlugin(),
        ExpressionPlugin(),
        CommonExpressionsPlugin()
    ]

    var body: some View {
        List(Self.mocks) { mock in
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

private extension A2UIDemoView {
    static let mocks: [A2UIMock] = [
        A2UIMock(name: "Text", snapshot: """
        {
          "surfaceId": "text-basic",
          "components": [
            { "id": "root", "component": "Text", "text": "Hello A2UI", "variant": "body" }
          ]
        }
        """),
        A2UIMock(name: "Column", snapshot: """
        {
          "surfaceId": "column-basic",
          "components": [
            { "id": "root", "component": "Column", "children": ["a", "b", "c"], "align": "start" },
            { "id": "a", "component": "Text", "text": "First", "variant": "h3" },
            { "id": "b", "component": "Text", "text": "Second" },
            { "id": "c", "component": "Text", "text": "Third" }
          ]
        }
        """),
        A2UIMock(name: "Button", snapshot: """
        {
          "surfaceId": "button-with-action",
          "components": [
            { "id": "root", "component": "Column", "children": ["hint", "btn"] },
            { "id": "hint", "component": "Text", "text": "Click the button to fire a 'submit' event." },
            { "id": "btn", "component": "Button", "child": "lbl", "variant": "primary", "action": { "event": { "name": "submit" } } },
            { "id": "lbl", "component": "Text", "text": "Submit" }
          ]
        }
        """),
        A2UIMock(name: "TextField", snapshot: """
        {
          "surfaceId": "text-field-validation",
          "data": { "user": { "email": "" } },
          "components": [
            {
              "id": "root",
              "component": "TextField",
              "label": "Email",
              "value": { "path": "/user/email" },
              "textFieldType": "shortText",
              "validationRegexp": "^[^@\\\\s]+@[^@\\\\s]+\\\\.[^@\\\\s]+$"
            }
          ]
        }
        """)
    ]
}
