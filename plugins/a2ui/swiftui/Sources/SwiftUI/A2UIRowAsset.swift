import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `Row` asset.
struct A2UIRowData: AssetData {
    var id: String
    var type: String
    var children: [WrappedAsset?]?
    var justify: String?
    var align: String?
}

/// Horizontal layout container — children are arranged left-to-right.
final class A2UIRowAsset: UncontrolledAsset<A2UIRowData> {
    public override var view: AnyView { AnyView(A2UIRowAssetView(model: model)) }
}

struct A2UIRowAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIRowData>

    var body: some View {
        HStack(alignment: a2uiVerticalAlignment(model.data.align), spacing: 8) {
            ForEach((model.data.children ?? []).compactMap { $0?.asset }) { asset in
                asset.view
            }
        }
        .accessibility(identifier: model.data.id)
    }
}
