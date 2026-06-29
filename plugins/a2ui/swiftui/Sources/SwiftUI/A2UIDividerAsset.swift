import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Divider` asset.
struct A2UIDividerData: AssetData {
    var id: String
    var type: String
    var axis: String?
}

/// Visual separator line, horizontal (default) or vertical.
final class A2UIDividerAsset: UncontrolledAsset<A2UIDividerData> {
    public override var view: AnyView { AnyView(A2UIDividerAssetView(model: model)) }
}

struct A2UIDividerAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIDividerData>

    var body: some View {
        if model.data.axis == "vertical" {
            Divider()
                .frame(maxHeight: .infinity)
                .accessibility(identifier: model.data.id)
        } else {
            Divider()
                .accessibility(identifier: model.data.id)
        }
    }
}
