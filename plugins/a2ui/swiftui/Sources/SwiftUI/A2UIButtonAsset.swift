import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Button` asset.
struct A2UIButtonData: AssetData {
    var id: String
    var type: String
    /// Component rendered inside the button (typically a Text).
    var child: WrappedAsset?
    var variant: String?
    /// Attached by the buttonTransform — fires `exp` then the `value` transition.
    var run: WrappedFunction<Void>?
}

/// Clickable element that triggers an action.
final class A2UIButtonAsset: UncontrolledAsset<A2UIButtonData> {
    public override var view: AnyView { AnyView(A2UIButtonAssetView(model: model)) }
}

struct A2UIButtonAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIButtonData>

    var body: some View {
        Button(action: { _ = model.data.run?() }) {
            if let child = model.data.child?.asset {
                child.view
            } else {
                EmptyView()
            }
        }
        .accessibility(identifier: model.data.id)
    }
}
