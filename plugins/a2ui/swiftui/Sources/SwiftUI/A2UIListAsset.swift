import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// Decoded data for the A2UI `List` asset.
struct A2UIListData: AssetData {
    var id: String
    var type: String
    var children: [WrappedAsset?]?
    var direction: String?
    var align: String?
}

/// Scrollable list of items, horizontal or vertical (default).
final class A2UIListAsset: UncontrolledAsset<A2UIListData> {
    public override var view: AnyView { AnyView(A2UIListAssetView(model: model)) }
}

struct A2UIListAssetView: View {
    @ObservedObject var model: AssetViewModel<A2UIListData>

    private var assets: [SwiftUIAsset] {
        (model.data.children ?? []).compactMap { $0?.asset }
    }

    var body: some View {
        if model.data.direction == "horizontal" {
            ScrollView(.horizontal) {
                HStack(spacing: 8) {
                    ForEach(assets) { $0.view }
                }
            }
            .accessibility(identifier: model.data.id)
        } else {
            ScrollView(.vertical) {
                VStack(alignment: a2uiHorizontalAlignment(model.data.align), spacing: 8) {
                    ForEach(assets) { $0.view }
                }
            }
            .accessibility(identifier: model.data.id)
        }
    }
}
