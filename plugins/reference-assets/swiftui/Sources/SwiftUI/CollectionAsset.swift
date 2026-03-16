import SwiftUI
import Combine

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 Data Decoded by Player for `CollectionAsset`
 */
struct CollectionData: AssetData {
    /// The ID of the asset
    var id: String
    /// The Type of the asset
    var type: String
    /// An optional label to title the collection
    var label: WrappedAsset?
    /// The assets to be rendered in this collection
    var values: [WrappedAsset?]
}

/**
 Wrapper class to tie `CollectionData` to a SwiftUI `View`
 */
final class CollectionAsset: UncontrolledAsset<CollectionData> {
    /// A type erased view object
    public override var view: AnyView { AnyView(CollectionAssetView(model: model)) }
}

/**
 View implementation for `CollectionAsset`
 */
struct CollectionAssetView: View {
    /// The viewModel with decoded data, supplied by `CollectionAsset`
    @ObservedObject var model: AssetViewModel<CollectionData>

    @ViewBuilder
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let asset = model.data.label?.asset {
                asset.view
                    .font(.headline)
                    .padding(.vertical, 12)
            }
            ForEach(model.data.values.compactMap({ $0?.asset })) { asset in
                    asset.view
                    .font(.body)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibility(identifier: model.data.id)
    }
}
