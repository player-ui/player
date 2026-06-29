import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Column` asset.
struct A2UIColumnData: AssetData {
    var id: String
    var type: String
    var children: [WrappedAsset?]?
    var justify: String?
    var align: String?
}

/// Vertical layout container — children are arranged top-to-bottom.
final class A2UIColumnAsset: UncontrolledAsset<A2UIColumnData> {
    public override var view: AnyView { AnyView(A2UIColumnAssetView(model: model)) }
}

struct A2UIColumnAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIColumnData>

    var body: some View {
        VStack(alignment: a2uiHorizontalAlignment(model.data.align), spacing: 8) {
            ForEach((model.data.children ?? []).compactMap { $0?.asset }) { asset in
                asset.view
            }
        }
        .accessibility(identifier: model.data.id)
    }
}
