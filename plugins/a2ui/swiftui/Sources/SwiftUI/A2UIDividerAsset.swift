import PlayerUI
import PlayerUISwiftUI
import SwiftUI

/// Decoded data for the A2UI `Divider` asset.
struct A2UIDividerData: AssetData {
    var id: String
    var type: String
    var axis: String?
}

/// Visual separator line, horizontal (default) or vertical.
final class A2UIDividerAsset: UncontrolledAsset<A2UIDividerData> {
    override var view: AnyView {
        AnyView(A2UIDividerAssetView(model: model))
    }
}

struct A2UIDividerAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIDividerData>

    var body: some View {
        Divider()
            .frame(maxHeight: model.data.axis == "vertical" ? .infinity : nil)
            .accessibility(identifier: model.data.id)
    }
}
